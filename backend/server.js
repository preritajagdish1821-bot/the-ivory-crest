const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const app = express();
const PORT = 3000;
const roomInventory = {
    "Standard Room - ₹2,000/night": 10,
    "Deluxe Room - ₹3,500/night": 8,
    "Executive Suite - ₹7,000/night": 5,
    "Presidential Suite - ₹12,000/night": 3
};
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

const adminSessions = new Map();
app.use(express.json());
app.use(cors());

const db = new Database("ivory-crest.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        room_type TEXT NOT NULL,
        checkin TEXT NOT NULL,
        checkout TEXT NOT NULL,
        guests INTEGER NOT NULL,
        rooms INTEGER NOT NULL,
        total_price INTEGER NOT NULL
    )
`);
try {
    db.exec(`
        ALTER TABLE bookings
        ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'hotel'
    `);
} catch (error) {
    // Column already exists
}
try {
    db.exec(`
        ALTER TABLE bookings
        ADD COLUMN booking_status TEXT NOT NULL DEFAULT 'Pending'
    `);

    } catch (error) {
        //column already exists
    }
db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guest_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);
// Get all reviews
app.get("/api/reviews", (req, res) => {

    const reviews = db.prepare(`
        SELECT *
        FROM reviews
        ORDER BY id DESC
    `).all();

    res.json(reviews);
});
// Admin-only reviews
app.get("/api/admin/reviews", requireAdmin, (req, res) => {

    const reviews = db.prepare(`
        SELECT *
        FROM reviews
        ORDER BY id DESC
    `).all();

    res.json(reviews);
});

// Add a new review
app.post("/api/reviews", (req, res) => {

    const {
        guest_name,
        rating,
        review_text
    } = req.body;

    if (!guest_name || !rating || !review_text) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all review details."
        });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: "Rating must be between 1 and 5 stars."
        });
    }

    try {

        db.prepare(`
            INSERT INTO reviews (
                guest_name,
                rating,
                review_text
            )
            VALUES (?, ?, ?)
        `).run(
            guest_name,
            rating,
            review_text
        );

        res.json({
            success: true,
            message: "Review submitted successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not save review."
        });

    }
});
// Delete a review
app.delete("/api/reviews/:id",requireAdmin, (req, res) => {

    const review = db.prepare(
        "DELETE FROM reviews WHERE id = ?"
    ).run(req.params.id);

    if (review.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Review not found."
        });
    }

    res.json({
        success: true,
        message: "Review deleted successfully."
    });
});
app.post("/api/admin/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username !== adminUsername ||
        password !== adminPassword
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password."
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    adminSessions.set(token, {
        createdAt: Date.now()
    });

    res.json({
        success: true,
        message: "Admin login successful.",
        token: token
    });
});
app.get("/api/admin/verify", (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!adminSessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session."
        });
    }

    res.json({
        success: true,
        message: "Admin session is valid."
    });
});
function requireAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!adminSessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session."
        });
    }

    next();
}
app.get("/", (req, res) => {
    res.send("Ivory Crest Backend is running!");
});
app.get("/api/bookings", (req, res) => {
    const bookings = db.prepare(`
        SELECT *,
        COALESCE(booking_status, 'Pending') AS booking_status
        FROM bookings
    `).all();

    res.json(bookings);
});
// Admin-only bookings
app.get("/api/admin/bookings", requireAdmin, (req, res) => {

    const bookings = db.prepare(`
        SELECT *,
        COALESCE(booking_status, 'Pending') AS booking_status
        FROM bookings
        ORDER BY id DESC
    `).all();

    res.json(bookings);
});
app.post("/api/bookings", (req, res) => {
    const {
        booking_id,
        guest_name,
        guest_email,
        room_type,
        checkin,
        checkout,
        guests,
        rooms,
        total_price,
        payment_method
    } = req.body;

    try {
        const totalRooms = roomInventory[room_type];

        if (!totalRooms) {
            return res.status(400).json({
                success: false,
                message: "Room type not found."
            });
        }

        const existingBookings = db.prepare(`
            SELECT COALESCE(SUM(rooms), 0) AS booked_rooms
            FROM bookings
            WHERE room_type = ?
            AND checkin < ?
            AND checkout > ?
        `).get(room_type, checkout, checkin);

        const availableRooms =
            totalRooms - existingBookings.booked_rooms;

        if (availableRooms < rooms) {
            return res.status(400).json({
                success: false,
                message: `Only ${availableRooms} room(s) are available for the selected dates.`
            });
        }
        const insertBooking = db.prepare(`
            INSERT INTO bookings (
                booking_id,
                guest_name,
                guest_email,
                room_type,
                checkin,
                checkout,
                guests,
                rooms,
                total_price,
                payment_method,
                booking_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertBooking.run(
            booking_id,
            guest_name,
            guest_email,
            room_type,
            checkin,
            checkout,
            guests,
            rooms,
            total_price,
            payment_method,
            "Pending"
        );

        res.json({
            success: true,
            message: "Booking saved successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not save booking"
        });
    }
});
app.get("/api/check-availability", (req, res) => {
    const { room_type, checkin, checkout } = req.query;

    const totalRooms = roomInventory[room_type];

    if (!totalRooms) {
        return res.status(400).json({
            available: false,
            message: "Room type not found."
        });
    }

    const booking = db.prepare(`
        SELECT COALESCE(SUM(rooms), 0) AS booked_rooms
        FROM bookings
        WHERE room_type = ?
        AND checkin < ?
        AND checkout > ?
    `).get(room_type, checkout, checkin);

    const bookedRooms = booking.booked_rooms;
    const availableRooms = totalRooms - bookedRooms;

    if (availableRooms > 0) {
        res.json({
            available: true,
            availableRooms: availableRooms,
            message: `${availableRooms} room(s) available for the selected dates.`
        });
    } else {
        res.json({
            available: false,
            availableRooms: 0,
            message: "No rooms of this type are available for the selected dates."
        });
    }
});
app.put("/api/bookings/:booking_id/confirm",requireAdmin, (req, res) => {

    const booking = db.prepare(`
        UPDATE bookings
        SET booking_status = 'Confirmed'
        WHERE booking_id = ?
    `).run(req.params.booking_id);

    if (booking.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Booking not found"
        });
    }

    res.json({
        success: true,
        message: "Booking confirmed successfully"
    });
});
app.delete("/api/bookings/:booking_id", (req, res) => {
    const booking = db.prepare(
        "DELETE FROM bookings WHERE booking_id = ?"
    ).run(req.params.booking_id);

    if (booking.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Booking not found"
        });
    }

    res.json({
        success: true,
        message: "Booking cancelled successfully"
    });
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});