// Get the selected room from the URL
const urlParams = new URLSearchParams(window.location.search);

const roomPrice = urlParams.get("room");

// Automatically select the room on the booking page
if (roomPrice) {
    const roomType = document.getElementById("room-type");

    if (roomType) {
        roomType.value = roomPrice;
    }
}
// Get booking form elements
const roomType = document.getElementById("room-type");
const checkin = document.getElementById("checkin");
const checkout = document.getElementById("checkout");
if (checkin) {
    const today = new Date().toISOString().split("T")[0];
    checkin.min = today;
}
if (checkin && checkout) {
    checkin.addEventListener("change", function () {
        checkout.min = checkin.value;

        if (checkout.value && checkout.value <= checkin.value) {
            checkout.value = "";
        }
    });

    checkout.addEventListener("change", function () {
        if (checkout.value <= checkin.value) {
            alert("Check-out date must be after check-in date.");
            checkout.value = "";
        }
    });
}
const guestsInput = document.getElementById("guests");
const capacityMessage = document.getElementById("capacity-message");

const pricePerNight = document.getElementById("price-per-night");
const totalNights = document.getElementById("total-nights");
const totalPrice = document.getElementById("total-price");
const roomsRequired = document.getElementById("rooms-required");

// Calculate booking price
function calculatePrice() {
    const price = Number(roomType.value);

    pricePerNight.textContent = price;

    if (checkin.value && checkout.value) {
        const startDate = new Date(checkin.value);
        const endDate = new Date(checkout.value);

        const nights = (endDate - startDate) / (1000 * 60 * 60 * 24);

        if (nights > 0) {
            totalNights.textContent = nights;

            const selectedRoom = roomDetails[roomType.value];
            const guests = Number(guestsInput.value) || 1;

            let rooms = 1;

            if (selectedRoom) {
                rooms = Math.ceil(guests / selectedRoom.capacity);
            }

            roomsRequired.textContent = rooms;

            totalPrice.textContent = price * nights * rooms;
        } else {
            totalNights.textContent = 0;
            totalPrice.textContent = 0;
        }
    } else {
        totalNights.textContent = 0;
        totalPrice.textContent = 0;
    }
}

// Update price when room or dates change
if (roomType && checkin && checkout && pricePerNight && totalNights && totalPrice) {

    roomType.addEventListener("change", calculatePrice);
    checkin.addEventListener("change", calculatePrice);
    checkout.addEventListener("change", calculatePrice);

    // Calculate price when the page loads
    calculatePrice();
}
// Booking Confirmation
const bookingForm = document.getElementById("booking-form");

if (bookingForm) {
    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("guest-name").value;
        const email = document.getElementById("guest-email").value;
        const room = document.getElementById("room-type");
        const roomName = room.options[room.selectedIndex].text;
        const checkinDate = document.getElementById("checkin").value;
        const checkoutDate = document.getElementById("checkout").value;
        const guests = Number(document.getElementById("guests").value);
        const paymentMethod = document.getElementById("payment-method").value;

        const price = Number(room.value);

        const startDate = new Date(checkinDate);
        const endDate = new Date(checkoutDate);

        const nights =
            (endDate - startDate) / (1000 * 60 * 60 * 24);

        if (!name || !email || !checkinDate || !checkoutDate || !guests || !paymentMethod) {
            alert("Please fill in all booking details.");
            return;
        }

        if (nights <= 0) {
            alert("Check-out date must be after check-in date.");
            return;
        }

        const rooms =
            Number(document.getElementById("rooms-required").textContent) || 1;
        const availabilityResponse = await fetch(
    `/api/check-availability?room_type=${encodeURIComponent(roomName)}&checkin=${checkinDate}&checkout=${checkoutDate}`
);

const availabilityResult = await availabilityResponse.json();

if (availabilityResult.availableRooms < rooms) {
    availabilityMessage.textContent =
        `❌ Only ${availabilityResult.availableRooms} room(s) are available. You need ${rooms} room(s) for ${guests} guests.`;

    availabilityMessage.style.color = "#b23b3b";

    return;
}

        const total = price * nights * rooms;

        const bookingID = "IC" + Date.now();

        const booking = {
            bookingID: bookingID,
            name: name,
            email: email,
            room: roomName,
            checkin: checkinDate,
            checkout: checkoutDate,
            guests: guests,
            total: total,
            paymentMethod: paymentMethod
        };

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    booking_id: bookingID,
                    guest_name: name,
                    guest_email: email,
                    room_type: roomName,
                    checkin: checkinDate,
                    checkout: checkoutDate,
                    guests: guests,
                    rooms: rooms,
                    total_price: total,
                    payment_method: paymentMethod
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert("Booking could not be saved.");
                return;
            }

            localStorage.setItem("booking", JSON.stringify(booking));

            window.location.href = "confirmation.html";

        } catch (error) {
            console.error(error);
            alert("Could not connect to the booking server.");
        }
    });
}

// Display booking details on confirmation page
const savedBooking = JSON.parse(localStorage.getItem("booking"));

if (savedBooking && document.getElementById("booking-id")) {
    document.getElementById("booking-id").textContent = savedBooking.bookingID;
    document.getElementById("confirm-name").textContent = savedBooking.name;
    document.getElementById("confirm-email").textContent = savedBooking.email;
    document.getElementById("confirm-room").textContent = savedBooking.room;
    document.getElementById("confirm-checkin").textContent = savedBooking.checkin;
    document.getElementById("confirm-checkout").textContent = savedBooking.checkout;
    document.getElementById("confirm-guests").textContent = savedBooking.guests;
    document.getElementById("confirm-payment").textContent =
    savedBooking.paymentMethod === "upi" ? "UPI" :
    savedBooking.paymentMethod === "card" ? "Credit / Debit Card" :
    savedBooking.paymentMethod === "netbanking" ? "Net Banking" :
    "Pay at Hotel";
    document.getElementById("confirm-total").textContent = savedBooking.total;
}
const commonPrivileges = [
    "🏊 Swimming Pool",
    "🏋️ Fitness Gym",
    "🎮 Recreation & Playing Area",
    "🍽️ Restaurant & Dining",
    "📶 Free Wi-Fi",
    "🚗 Free Parking",
    "🛎️ 24/7 Room Service"
];
const roomDetails = {
    2000: {
        name: "Standard Room",
        description: "Enjoy a relaxing stay in our thoughtfully designed Standard Room, offering a comfortable space, modern amenities, and a peaceful atmosphere for a pleasant stay at The Ivory Crest.",
        capacity: 2,
        facilities: [
    "🛏️ One Double Bed",
    "❄️ Air Conditioning",
    "🪑 Comfortable Seating Area",
    "💻 Dedicated Work Area",
    "🚿 Attached Bathroom",
    "📺 Television"
]
    },
    3500: {
    name: "Deluxe Room",
    description: "Relax in our spacious Deluxe Room, designed for a comfortable stay with additional sleeping space, modern amenities, and a welcoming atmosphere.",
    capacity: 3,
    facilities: [
        "🛏️ One Double Bed",
        "🛏️ One Single Bed",
        "❄️ Air Conditioning",
        "📺 Television",
        "🚿 Attached Bathroom",
        "🌿 Private Balcony",
        "🪑 Comfortable Seating Area",
        "💻 Dedicated Work Area"
    ]
},
    7000: {
    name: "Executive Suite",
    description: "Enjoy a spacious Executive Suite featuring two separate bedrooms, comfortable sleeping arrangements, and elegant shared spaces designed for a relaxing stay.",
    capacity: 4,
    facilities: [
        "🛏️ Bedroom 1 – One Double Bed",
        "🛏️ Bedroom 2 – One Double Bed",
        "🛋️ Spacious Living Area",
        "🍽️ Dining Area",
        "🍳 Fully Equipped Kitchen",
        "❄️ Air Conditioning",
        "📺 Television",
        "🚿 Attached Bathrooms",
        "🌿 Private Balcony",
        "💻 Dedicated Work Area"

    ]
},
    12000: {
    name: "Presidential Suite",
    description: "Experience the ultimate luxury in our spacious Presidential Suite, featuring three private bedrooms, elegant living spaces, a mini bar, dining area, balconies, and premium amenities for an unforgettable stay.",
    capacity: 6,
    facilities: [
        "🛏️ Bedroom 1 – One Double Bed",
        "🛏️ Bedroom 2 – One Double Bed",
        "🛏️ Bedroom 3 – One Double Bed",
        "🛋️ Large Luxury Living Room",
        "🍸 Mini Bar",
        "🍽️ Private Dining Area",
        "🍳 Private Luxury Kitchen",
        "🚿 Attached Bathrooms",
        "📺 Television",
        "❄️ Air Conditioning",
        "💻 Dedicated Work Area",
        "🌿 Large Private Balcony"
    ],
    exclusivePrivileges: [
    "🏊 Private Plunge Pool",
    "🛎️ Dedicated Butler Service",
    "🍽️ Private Dining Experience",
    "🚗 Premium Private Parking",
    "🌟 Personalized Guest Service"
]
},
};
const paymentMethodSelect = document.getElementById("payment-method");

const upiDetails = document.getElementById("upi-details");
const cardDetails = document.getElementById("card-details");
const netbankingDetails = document.getElementById("netbanking-details");

const upiId = document.getElementById("upi-id");

const cardNumber = document.getElementById("card-number");
const cardName = document.getElementById("card-name");
const cardExpiry = document.getElementById("card-expiry");
const cardCVV = document.getElementById("card-cvv");

const bankName = document.getElementById("bank-name");

if (paymentMethodSelect) {

    paymentMethodSelect.addEventListener("change", function() {

        upiDetails.style.display = "none";
        cardDetails.style.display = "none";
        netbankingDetails.style.display = "none";

        upiId.required = false;

        cardNumber.required = false;
        cardName.required = false;
        cardExpiry.required = false;
        cardCVV.required = false;

        bankName.required = false;


        if (paymentMethodSelect.value === "upi") {

            upiDetails.style.display = "block";
            upiId.required = true;

        }


        if (paymentMethodSelect.value === "card") {

            cardDetails.style.display = "block";

            cardNumber.required = true;
            cardName.required = true;
            cardExpiry.required = true;
            cardCVV.required = true;

        }


        if (paymentMethodSelect.value === "netbanking") {

            netbankingDetails.style.display = "block";
            bankName.required = true;

        }

    });
}

const facilityImage = document.getElementById("facility-image");
const facilityTitle = document.getElementById("facility-title");
const facilityNumber = document.getElementById("facility-number");
const facilityPrev = document.getElementById("facility-prev");
const facilityNext = document.getElementById("facility-next");

if (facilityImage) {

    const facilityPhotos = [
        {
            image: "images/11_reception.png",
            title: "Reception"
        },
        {
            image: "images/01_swimming_pool.png",
            title: "Swimming Pool"
        },
        {
            image: "images/02_fitness_gym.png",
            title: "Fitness Gym"
        },
        {
            image: "images/03_recreation_playing_area.png",
            title: "Recreation & Playing Area"
        },
        {
            image: "images/04_restaurant_dining.png",
            title: "Restaurant & Dining"
        },
        {
            image: "images/05_lobby_lounge.png",
            title: "Lobby Lounge"
        },
        {
            image: "images/06_guest_room.png",
            title: "Guest Rooms"
        },
        {
            image: "images/07_modern_bathroom.png",
            title: "Modern Bathrooms"
        },
        {
            image: "images/08_free_wifi.png",
            title: "Free Wi-Fi"
        },
        {
            image: "images/09_free_parking.png",
            title: "Free Parking"
        },
        {
            image: "images/10_room_service.png",
            title: "24/7 Room Service"
        },
        {
            image: "images/12_spa_wellness.png",
            title: "Spa & Wellness"
        },
        {
            image: "images/13_banquet_hall.png",
            title: "Banquet Hall"
        },
        {
            image: "images/14_garden_area.png",
            title: "Garden Area"
        },
        {
            image: "images/15_laundry_service.png",
            title: "Laundry Service"
        },
        {
            image: "images/16_business_center.png",
            title: "Business Center"
        }
    ];

    let currentFacility = 0;

    const facilityViewer =
        document.getElementById("facility-photo-viewer");

    const facilityViewerImage =
        document.getElementById("facility-viewer-image");

    const facilityViewerTitle =
        document.getElementById("facility-viewer-title");

    const facilityViewerCounter =
        document.getElementById("facility-viewer-counter");

    const closeFacilityViewer =
        document.getElementById("close-facility-viewer");

    const facilityViewerPrev =
        document.getElementById("facility-viewer-prev");

    const facilityViewerNext =
        document.getElementById("facility-viewer-next");

    let viewerFacilityIndex = 0;
    let viewerZoom = 1;

    let touchStartX = 0;
    let touchEndX = 0;


    function showFacility(index) {

        currentFacility = index;

        facilityImage.src =
            facilityPhotos[currentFacility].image;

        facilityImage.alt =
            facilityPhotos[currentFacility].title;

        facilityTitle.textContent =
            facilityPhotos[currentFacility].title;

        facilityNumber.textContent =
            currentFacility + 1;

    }


    function updateViewer() {

        facilityViewerImage.src =
            facilityPhotos[viewerFacilityIndex].image;

        facilityViewerImage.alt =
            facilityPhotos[viewerFacilityIndex].title;

        facilityViewerTitle.textContent =
            facilityPhotos[viewerFacilityIndex].title;

        facilityViewerCounter.textContent =
            (viewerFacilityIndex + 1) +
            " / " +
            facilityPhotos.length;

        facilityViewerImage.style.transform =
            "scale(" + viewerZoom + ")";

    }


    function openViewer(index) {

        viewerFacilityIndex = index;
        viewerZoom = 1;

        updateViewer();

        facilityViewer.classList.add("active");

    }


    function closeViewer() {

        facilityViewer.classList.remove("active");

        viewerZoom = 1;

        facilityViewerImage.style.transform =
            "scale(1)";

    }


    function nextViewerPhoto() {

        viewerFacilityIndex++;

        if (viewerFacilityIndex >= facilityPhotos.length) {
            viewerFacilityIndex = 0;
        }

        viewerZoom = 1;

        updateViewer();

    }


    function previousViewerPhoto() {

        viewerFacilityIndex--;

        if (viewerFacilityIndex < 0) {
            viewerFacilityIndex = facilityPhotos.length - 1;
        }

        viewerZoom = 1;

        updateViewer();

    }


    /* Main slider - Next */

    facilityNext.addEventListener("click", function() {

        currentFacility++;

        if (currentFacility >= facilityPhotos.length) {
            currentFacility = 0;
        }

        showFacility(currentFacility);

    });


    /* Main slider - Previous */

    facilityPrev.addEventListener("click", function() {

        currentFacility--;

        if (currentFacility < 0) {
            currentFacility = facilityPhotos.length - 1;
        }

        showFacility(currentFacility);

    });


    /* Click main photo */

    facilityImage.addEventListener("click", function() {

        openViewer(currentFacility);

    });


    /* Viewer Next */

    facilityViewerNext.addEventListener("click", function() {

        nextViewerPhoto();

    });


    /* Viewer Previous */

    facilityViewerPrev.addEventListener("click", function() {

        previousViewerPhoto();

    });


    /* Close viewer */

    closeFacilityViewer.addEventListener("click", function() {

        closeViewer();

    });


    /* Keyboard arrows + Escape */

    document.addEventListener("keydown", function(event) {

        if (!facilityViewer.classList.contains("active")) {
            return;
        }

        if (event.key === "ArrowRight") {
            nextViewerPhoto();
        }

        if (event.key === "ArrowLeft") {
            previousViewerPhoto();
        }

        if (event.key === "Escape") {
            closeViewer();
        }

    });


    /* Mouse wheel zoom */

    facilityViewerImage.addEventListener("wheel", function(event) {

        event.preventDefault();

        if (event.deltaY < 0) {
            viewerZoom += 0.1;
        } else {
            viewerZoom -= 0.1;
        }

        if (viewerZoom < 0.5) {
            viewerZoom = 0.5;
        }

        if (viewerZoom > 3) {
            viewerZoom = 3;
        }

        facilityViewerImage.style.transform =
            "scale(" + viewerZoom + ")";

    });


    /* Mobile swipe */

    facilityViewerImage.addEventListener("touchstart", function(event) {

        touchStartX = event.touches[0].clientX;

    });


    facilityViewerImage.addEventListener("touchend", function(event) {

        touchEndX = event.changedTouches[0].clientX;

        const swipeDistance =
            touchEndX - touchStartX;

        if (Math.abs(swipeDistance) < 50) {
            return;
        }

        if (swipeDistance < 0) {
            nextViewerPhoto();
        } else {
            previousViewerPhoto();
        }

    });


    showFacility(0);
}
function updateRoomCapacity() {
    if (!roomType || !guestsInput || !capacityMessage) {
        return;
    }

    const selectedRoom = roomDetails[roomType.value];

    if (selectedRoom) {
        capacityMessage.textContent =
            "👥 This room accommodates up to " +
            selectedRoom.capacity +
            " guests.";
    }
}
if (roomType) {
    roomType.addEventListener("change", updateRoomCapacity);
    updateRoomCapacity();
}
function updateRoomsRequired() {
    if (!roomType || !guestsInput || !roomsRequired) {
        return;
    }

    const selectedRoom = roomDetails[roomType.value];
    const guests = Number(guestsInput.value) || 1;

    if (selectedRoom) {
        const rooms = Math.ceil(guests / selectedRoom.capacity);
        roomsRequired.textContent = rooms;
    }
}

if (roomType && guestsInput) {
    roomType.addEventListener("change", function () {
        updateRoomsRequired();
        calculatePrice();
    });

    guestsInput.addEventListener("input", function () {
        updateRoomsRequired();
        calculatePrice();
    });

    updateRoomsRequired();
}
const roomDetailsPage = document.getElementById("room-title");

if (roomDetailsPage) {
    const params = new URLSearchParams(window.location.search);
    const roomPrice = params.get("room");

    const room = roomDetails[roomPrice];

    if (room) {
        document.getElementById("room-title").textContent = room.name;
        document.getElementById("room-description").textContent = room.description;
        document.getElementById("room-price").textContent = roomPrice;

        const facilitiesList = document.getElementById("room-facilities");
        facilitiesList.innerHTML = "";

        room.facilities.forEach(function(facility) {
            const block = document.createElement("div");
            block.className = "facility-block";
            block.textContent = facility;
            facilitiesList.appendChild(block);
        });
        const commonPrivilegesList = document.getElementById("common-privileges");

if (commonPrivilegesList) {
    commonPrivilegesList.innerHTML = "";

    commonPrivileges.forEach(function(privilege) {
        const block = document.createElement("div");
        block.className = "facility-block";
        block.textContent = privilege;
        commonPrivilegesList.appendChild(block);
    });
}
        const exclusiveSection = document.getElementById("exclusive-section");
const exclusivePrivileges = document.getElementById("exclusive-privileges");

if (room.exclusivePrivileges && exclusiveSection && exclusivePrivileges) {
    exclusiveSection.style.display = "block";
    exclusivePrivileges.innerHTML = "";

    room.exclusivePrivileges.forEach(function(privilege) {
        const block = document.createElement("div");
        block.className = "facility-block";
        block.textContent = privilege;
        exclusivePrivileges.appendChild(block);
    });
}
    }
}

const roomGallery = document.getElementById("room-gallery");

if (roomGallery) {
    const params = new URLSearchParams(window.location.search);
    const roomPrice = params.get("room");

    if (roomPrice === "2000") {
    roomGallery.innerHTML = `
        <div class="gallery-item">
            <img src="images/standard-bedroom.png" alt="Standard Room Bedroom">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/standard-bathroom.png" alt="Standard Room Bathroom">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/standard-balcony.png" alt="Standard Room Balcony">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/standard-seating-work-area.png" alt="Standard Room Seating Area">
        </div>
    `;
}
    if (roomPrice === "3500") {
    roomGallery.innerHTML = `
        <div class="gallery-item">
            <img src="images/deluxe-bedroom.png" alt="Deluxe Room Bedroom">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/deluxe-bathroom.png" alt="Deluxe Room Bathroom">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/deluxe-balcony.png" alt="Deluxe Room Balcony">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/deluxe-seating-work-area.png" alt="Deluxe Room Seating and Work Area">
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/deluxe-room-angle.png" alt="Deluxe Room Interior">
        </div>
    `;
}
if (roomPrice === "7000") {
    roomGallery.innerHTML = `
        <div class="gallery-item">
            <img src="images/executive-main-view.png" alt="Executive Suite Main View">
            <p class="photo-label">Executive Suite — Main View</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-living-room-view-1.png" alt="Executive Suite Living Room View 1">
            <p class="photo-label">Executive Suite — Living Room View 1</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-living-room-view-2.png" alt="Executive Suite Living Room View 2">
            <p class="photo-label">Executive Suite — Living Room View 2</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bedroom-1-main.png" alt="Executive Suite Bedroom 1">
            <p class="photo-label">Executive Suite — Bedroom 1</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bedroom-2-main.png" alt="Executive Suite Bedroom 2">
            <p class="photo-label">Executive Suite — Bedroom 2</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-dining-area.png" alt="Executive Suite Dining Area">
            <p class="photo-label">Executive Suite — Dining Area</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-kitchen-view-1.png" alt="Executive Suite Kitchen View 1">
            <p class="photo-label">Executive Suite — Kitchen View 1</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-kitchen-view-2.png" alt="Executive Suite Kitchen View 2">
            <p class="photo-label">Executive Suite — Kitchen View 2</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bathroom-1-overview.png" alt="Executive Suite Bathroom 1">
            <p class="photo-label">Executive Suite — Bathroom 1 Overview</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bathroom-1-shower.png" alt="Executive Suite Bathroom 1 Shower">
            <p class="photo-label">Executive Suite — Bathroom 1 Shower</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bathroom-2-overview.png" alt="Executive Suite Bathroom 2">
            <p class="photo-label">Executive Suite — Bathroom 2 OverView</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-bathroom-2-shower.png" alt="Executive Suite Bathroom 2 Shower">
            <p class="photo-label">Executive Suite — Bathroom 2 Shower</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-balcony-view-1.png" alt="Executive Suite Balcony View 1">
            <p class="photo-label">Executive Suite — Balcony View 1</p>

        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/executive-balcony-view-2.png" alt="Executive Suite Balcony View 2">
            <p class="photo-label">Executive Suite — Balcony View 2</p>

        </div>
    `;
}
if (roomPrice === "12000") {
    roomGallery.innerHTML = `
        <div class="gallery-item">
            <img src="images/01_suite_hallway.jpg" alt="Presidential Suite Hallway">
            <p class="photo-label">Presidential Suite — Hallway</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/02_bedroom_1_double_bed.jpg" alt="Presidential Suite Bedroom 1">
            <p class="photo-label">Presidential Suite — Bedroom 1</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/03_bedroom_2_double_bed.jpg" alt="Presidential Suite Bedroom 2">
            <p class="photo-label">Presidential Suite — Bedroom 2</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/04_bedroom_3_double_bed.jpg" alt="Presidential Suite Bedroom 3">
            <p class="photo-label">Presidential Suite — Bedroom 3</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/05_luxury_living_room.png" alt="Presidential Suite Luxury Living Room">
            <p class="photo-label">Presidential Suite — Luxury Living Room</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/06_mini_bar.png" alt="Presidential Suite Mini Bar">
            <p class="photo-label">Presidential Suite — Mini Bar</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/07_private_dining_area.png" alt="Presidential Suite Private Dining Area">
            <p class="photo-label">Presidential Suite — Private Dining Area</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/08_attached_bathroom.png" alt="Presidential Suite Attached Bathroom">
            <p class="photo-label">Presidential Suite — Attached Bathroom</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/09_television_media_area.png" alt="Presidential Suite Television and Media Area">
            <p class="photo-label">Presidential Suite — Television & Media Area</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/10_dedicated_work_area.png" alt="Presidential Suite Dedicated Work Area">
            <p class="photo-label">Presidential Suite — Dedicated Work Area</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/11_large_private_balcony.png" alt="Presidential Suite Large Private Balcony">
            <p class="photo-label">Presidential Suite — Large Private Balcony</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/12_private_plunge_pool.png" alt="Presidential Suite Private Plunge Pool">
            <p class="photo-label">Presidential Suite — Private Plunge Pool</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/13_dedicated_butler_service.png" alt="Presidential Suite Dedicated Butler Service">
            <p class="photo-label">Presidential Suite — Dedicated Butler Service</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/14_private_dining_experience.png" alt="Presidential Suite Private Dining Experience">
            <p class="photo-label">Presidential Suite — Private Dining Experience</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/15_premium_private_parking.png" alt="Presidential Suite Premium Private Parking">
            <p class="photo-label">Presidential Suite — Premium Private Parking</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/16_personalized_guest_service.png" alt="Presidential Suite Personalized Guest Service">
            <p class="photo-label">Presidential Suite — Personalized Guest Service</p>
        </div>

        <div class="gallery-item" style="display: none;">
            <img src="images/17_private_luxury_kitchen.png" alt="Presidential Suite Private Luxury Kitchen">
            <p class="photo-label">Presidential Suite — Private Luxury Kitchen</p>
        </div>
    `;
}
}
const bookingRoomInfo = document.querySelector(".booking-room-info");

if (bookingRoomInfo) {
    const bookingRoomName = document.getElementById("booking-room-name");
    const bookingRoomCapacity = document.getElementById("booking-room-capacity");
    const bookingRoomBed = document.getElementById("booking-room-bed");
    const bookingRoomFeatures = document.getElementById("booking-room-features");

    function updateBookingRoomInfo() {
        const selectedRoom = roomDetails[roomType.value];

        if (!selectedRoom) {
            return;
        }

        bookingRoomName.textContent = selectedRoom.name;
        bookingRoomCapacity.textContent = selectedRoom.capacity;

        const firstBeds = selectedRoom.facilities.filter(function(facility) {
            return facility.includes("Bed");
        });

        bookingRoomBed.textContent = firstBeds.length > 0
            ? firstBeds.join(" • ")
            : "Comfortable bed setup";

        bookingRoomFeatures.innerHTML = "";

        selectedRoom.facilities.forEach(function(facility) {
            const feature = document.createElement("div");
            feature.className = "feature-item";
            feature.textContent = facility;
            bookingRoomFeatures.appendChild(feature);
        });
    }

    if (roomType) {
        roomType.addEventListener("change", updateBookingRoomInfo);
        updateBookingRoomInfo();
    }
}
const availabilityButton = document.getElementById("check-availability");
const availabilityMessage = document.getElementById("availability-message");

if (availabilityButton) {
    availabilityButton.addEventListener("click", function () {

        if (!checkin.value || !checkout.value) {
            availabilityMessage.textContent =
                "⚠️ Please select both check-in and check-out dates.";
            availabilityMessage.style.color = "#b23b3b";
            return;
        }

        if (checkout.value <= checkin.value) {
            availabilityMessage.textContent =
                "⚠️ Check-out date must be after check-in date.";
            availabilityMessage.style.color = "#b23b3b";
            return;
        }
        const roomTypeElement = document.getElementById("room-type");
        const roomType = roomTypeElement.options[roomTypeElement.selectedIndex].text;

        availabilityMessage.textContent = "Checking availability...";
        availabilityMessage.style.color = "#8a6d3b";

        fetch(
            `/api/check-availability?room_type=${encodeURIComponent(roomType)}&checkin=${checkin.value}&checkout=${checkout.value}`
        )
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {

                availabilityMessage.textContent =
                    result.available ? "✅ " + result.message : "❌ " + result.message;

                availabilityMessage.style.color =
                    result.available ? "#4f7a4f" : "#b23b3b";
            })
            .catch(function(error) {
                console.error(error);

                availabilityMessage.textContent =
                    "⚠️ Could not check availability.";
                availabilityMessage.style.color = "#b23b3b";
            });
    });
}
const bookingDetails = document.getElementById("booking-details");

if (bookingDetails) {
    fetch("/api/bookings")
        .then(function(response) {
            return response.json();
        })
    
        .then(function(bookings) {

            if (bookings.length === 0) {
                bookingDetails.innerHTML = "<p>No booking found.</p>";
                return;
            }
        
            bookingDetails.innerHTML = bookings.map(function(booking) {
    return `
        <div class="booking-card">
            <h2>${booking.room_type}</h2>

            <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
            <p><strong>Guest Name:</strong> ${booking.guest_name}</p>
            <p><strong>Email:</strong> ${booking.guest_email}</p>
            <p><strong>Check-in:</strong> ${booking.checkin}</p>
            <p><strong>Check-out:</strong> ${booking.checkout}</p>
            <p><strong>Guests:</strong> ${booking.guests}</p>
            <p><strong>Payment Method:</strong> ${
    booking.payment_method === "upi" ? "UPI" :
    booking.payment_method === "card" ? "Credit / Debit Card" :
    booking.payment_method === "netbanking" ? "Net Banking" :
    "Pay at Hotel"
}</p>
            <p><strong>Rooms:</strong> ${booking.rooms}</p>
            <p><strong>Total Price:</strong> ₹${booking.total_price}</p>

<p>
    <strong>Status:</strong>
    <span class="status status-${(booking.booking_status || "Pending").toLowerCase()}">
        ${booking.booking_status || "Pending"}
    </span>
</p>

<button class="cancel-btn" data-booking-id="${booking.booking_id}">
    Cancel Booking
</button>
        </div>
    `;
}).join("");
const cancelButtons = document.querySelectorAll(".cancel-btn");

cancelButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const bookingID = button.getAttribute("data-booking-id");

        const confirmCancel = confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmCancel) {
            return;
        }

        fetch(`/api/bookings/${bookingID}`, {
            method: "DELETE"
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {

                if (!result.success) {
                    alert("Booking could not be cancelled.");
                    return;
                }

                alert("Your booking has been cancelled.");

                window.location.reload();
            })
            .catch(function(error) {
                console.error(error);
                alert("Could not connect to the booking server.");
            });
    });

});
        });
    }

const photoViewer = document.getElementById("photo-viewer");
const viewerImage = document.getElementById("viewer-image");
const viewerLabel = document.getElementById("viewer-label");
const closePhotoViewer = document.getElementById("close-photo-viewer");
const previousPhoto = document.getElementById("previous-photo");
const nextPhoto = document.getElementById("next-photo");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");
const zoomLevel = document.getElementById("zoom-level");

let galleryImages = [];
let currentPhotoIndex = 0;
let currentZoom = 1;

function updateViewerImage() {
    if (!viewerImage || galleryImages.length === 0) {
        return;
    }

    viewerImage.src = galleryImages[currentPhotoIndex];

const currentGalleryImage = document.querySelectorAll(".room-gallery img")[currentPhotoIndex];
const currentLabel = currentGalleryImage.parentElement.querySelector(".photo-label");

if (viewerLabel && currentLabel) {
    viewerLabel.textContent = currentLabel.textContent;
}

currentZoom = 1;
    viewerImage.style.transform = "scale(1)";
    zoomLevel.textContent = "100%";
}

function openPhotoViewer(index) {
    if (!photoViewer || galleryImages.length === 0) {
        return;
    }

    currentPhotoIndex = index;
    photoViewer.classList.add("active");
    updateViewerImage();
}

function closeViewer() {
    if (photoViewer) {
        photoViewer.classList.remove("active");
    }
}

if (photoViewer) {

    const galleryPhotoElements = document.querySelectorAll(".room-gallery img");

    galleryPhotoElements.forEach(function(image, index) {

        galleryImages.push(image.src);

        image.style.cursor = "zoom-in";

        image.addEventListener("click", function() {
            openPhotoViewer(index);
        });
    });

    if (closePhotoViewer) {
        closePhotoViewer.addEventListener("click", closeViewer);
    }

    if (nextPhoto) {
        nextPhoto.addEventListener("click", function() {

            currentPhotoIndex =
                (currentPhotoIndex + 1) % galleryImages.length;

            updateViewerImage();
        });
    }

    if (previousPhoto) {
        previousPhoto.addEventListener("click", function() {

            currentPhotoIndex =
                (currentPhotoIndex - 1 + galleryImages.length)
                % galleryImages.length;

            updateViewerImage();
        });
    }

    if (zoomIn) {
        zoomIn.addEventListener("click", function() {

            if (currentZoom < 2.5) {
                currentZoom += 0.25;
            }

            viewerImage.style.transform =
                "scale(" + currentZoom + ")";

            zoomLevel.textContent =
                Math.round(currentZoom * 100) + "%";
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener("click", function() {

            if (currentZoom > 0.5) {
                currentZoom -= 0.25;
            }

            viewerImage.style.transform =
                "scale(" + currentZoom + ")";

            zoomLevel.textContent =
                Math.round(currentZoom * 100) + "%";
        });
    }

    photoViewer.addEventListener("click", function(event) {

        if (event.target === photoViewer) {
            closeViewer();
        }

    });

    document.addEventListener("keydown", function(event) {

        if (!photoViewer.classList.contains("active")) {
            return;
        }

        if (event.key === "Escape") {
            closeViewer();
        }

        if (event.key === "ArrowRight") {
            nextPhoto.click();
        }

        if (event.key === "ArrowLeft") {
            previousPhoto.click();
        }

    });
}
// Admin Dashboard
const adminBookings = document.getElementById("admin-bookings");

if (adminBookings) {

    fetch("/api/admin/bookings", {
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
    }
})
        .then(function(response) {
            return response.json();
        })
        .then(function(bookings) {

            if (bookings.length === 0) {
                adminBookings.innerHTML =
                    "<p>No bookings have been made yet.</p>";
                return;
            }

            adminBookings.innerHTML = bookings.map(function(booking) {

                return `
                    <div class="admin-booking-card">

                        <h2>${booking.room_type}</h2>

                        <p>
                            <strong>Booking ID:</strong>
                            ${booking.booking_id}
                        </p>

                        <p>
                            <strong>Guest Name:</strong>
                            ${booking.guest_name}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${booking.guest_email}
                        </p>

                        <p>
                            <strong>Check-in:</strong>
                            ${booking.checkin}
                        </p>

                        <p>
                            <strong>Check-out:</strong>
                            ${booking.checkout}
                        </p>

                        <p>
                            <strong>Guests:</strong>
                            ${booking.guests}
                        </p>

                        <p>
                            <strong>Rooms:</strong>
                            ${booking.rooms}
                        </p>

                        <p>
                            <strong>Payment Method:</strong>
                            ${
                                booking.payment_method === "upi"
                                    ? "UPI"
                                    : booking.payment_method === "card"
                                    ? "Credit / Debit Card"
                                    : booking.payment_method === "netbanking"
                                    ? "Net Banking"
                                    : "Pay at Hotel"
                            }
                        </p>

                        <p>
                            <strong>Total Price:</strong>
                            ₹${booking.total_price}
                        </p>
                        <p>
    <strong>Status:</strong>
    <span class="status status-${
        (booking.booking_status || "Pending").toLowerCase()
    }">
        ${booking.booking_status || "Pending"}
    </span>
</p>

${
    (booking.booking_status || "Pending") === "Pending"
    ? `
        <button
            class="admin-action-btn confirm-btn"
            data-booking-id="${booking.booking_id}">
            ✅ Confirm Booking
        </button>
      `
    : ""
}

                    </div>
                `;

            }).join("");
            const confirmButtons =
    document.querySelectorAll(".confirm-btn");

confirmButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const bookingID =
            button.getAttribute("data-booking-id");

        fetch(`/api/bookings/${bookingID}/confirm`, {
            method: "PUT",
            headers: {
        "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
    }
})
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {

            if (!result.success) {
                alert("Booking could not be confirmed.");
                return;
            }

            alert("Booking confirmed successfully.");

            window.location.reload();

        })
        .catch(function(error) {

            console.error(error);

            alert("Could not connect to the booking server.");

        });

    });

});

        })
        .catch(function(error) {

            console.error(error);

            adminBookings.innerHTML =
                "<p>Could not load bookings.</p>";

        });
}
// =========================
// GUEST REVIEWS
// =========================

const reviewName = document.getElementById("review-name");
const reviewText = document.getElementById("review-text");
const submitReview = document.getElementById("submit-review");
const reviewMessage = document.getElementById("review-message");
const reviewsList = document.getElementById("reviews-list");
const ratingInputs =
    document.querySelectorAll('input[name="rating"]');

ratingInputs.forEach(function(input) {

    input.addEventListener("change", function() {

        const selectedValue = Number(input.value);

        ratingInputs.forEach(function(item) {

            const label = document.querySelector(
                'label[for="' + item.id + '"]'
            );

            if (Number(item.value) <= selectedValue) {
                label.textContent = "★";
                label.style.color = "#c49745";
            } else {
                label.textContent = "☆";
                label.style.color = "#d8cbb8";
            }

        });

    });

});


// Load existing reviews
if (reviewsList) {

    fetch("/api/reviews")
        .then(function(response) {
            return response.json();
        })
        .then(function(reviews) {

            if (reviews.length === 0) {
                reviewsList.innerHTML =
                    "<p>No reviews yet. Be the first to review your stay!</p>";
                return;
            }

            reviewsList.innerHTML = reviews.map(function(review) {

                const stars = "★".repeat(review.rating) +
                              "☆".repeat(5 - review.rating);

                return `
                    <div class="review-card">

                        <h4>${review.guest_name}</h4>

                        <div class="review-stars">
                            ${stars}
                        </div>

                        <p>${review.review_text}</p>

                    </div>
                `;

            }).join("");

        })
        .catch(function(error) {

            console.error(error);

            reviewsList.innerHTML =
                "<p>Could not load reviews.</p>";

        });
}


// Submit a new review
if (submitReview) {

    submitReview.addEventListener("click", function() {

        const selectedRating =
            document.querySelector('input[name="rating"]:checked');

        const name = reviewName.value.trim();
        const text = reviewText.value.trim();

        if (!name || !selectedRating || !text) {

            reviewMessage.textContent =
                "Please enter your name, rating and review.";

            reviewMessage.style.color = "#b23b3b";

            return;
        }

        const rating = Number(selectedRating.value);

        fetch("/api/reviews", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                guest_name: name,
                rating: rating,
                review_text: text
            })

        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {

            if (!result.success) {

                reviewMessage.textContent =
                    result.message || "Review could not be submitted.";

                reviewMessage.style.color = "#b23b3b";

                return;
            }

            reviewMessage.textContent =
                "✅ Your review has been submitted.";

            reviewMessage.style.color = "#4f7a4f";

            reviewName.value = "";
            reviewText.value = "";

            const selectedStars =
                document.querySelector('input[name="rating"]:checked');

            if (selectedStars) {
                selectedStars.checked = false;
            }
            ratingInputs.forEach(function(input) {

    const label = document.querySelector(
        'label[for="' + input.id + '"]'
    );

    label.textContent = "☆";
    label.style.color = "#d8cbb8";

});

            setTimeout(function() {
                window.location.reload();
            }, 800);

        })
        .catch(function(error) {

            console.error(error);

            reviewMessage.textContent =
                "Could not connect to the review server.";

            reviewMessage.style.color = "#b23b3b";

        });

    });

}
// =========================
// ADMIN GUEST REVIEWS
// =========================

const adminReviews = document.getElementById("admin-reviews");

if (adminReviews) {

    function loadAdminReviews() {

        fetch("/api/admin/reviews", {
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
    }
})
            .then(function(response) {
                return response.json();
            })
            .then(function(reviews) {

                if (reviews.length === 0) {
                    adminReviews.innerHTML =
                        "<p>No guest reviews yet.</p>";
                    return;
                }

                adminReviews.innerHTML = reviews.map(function(review) {

                    const stars =
                        "★".repeat(review.rating) +
                        "☆".repeat(5 - review.rating);

                    return `
                        <div class="admin-review-card">

                            <h3>${review.guest_name}</h3>

                            <div class="admin-review-stars">
                                ${stars}
                            </div>

                            <p>${review.review_text}</p>

                            <p class="admin-review-date">
                                ${new Date(review.created_at).toLocaleDateString()}
                            </p>

                            <button
                                class="delete-review-btn"
                                data-review-id="${review.id}">
                                🗑️ Delete Review
                            </button>

                        </div>
                    `;

                }).join("");


                // Delete review buttons

                const deleteReviewButtons =
                    document.querySelectorAll(".delete-review-btn");

                deleteReviewButtons.forEach(function(button) {

                    button.addEventListener("click", function() {

                        const reviewID =
                            button.getAttribute("data-review-id");

                        const confirmDelete = confirm(
                            "Are you sure you want to delete this review?"
                        );

                        if (!confirmDelete) {
                            return;
                        }

                        fetch(
                            `/api/reviews/${reviewID}`,
                            {
                                method: "DELETE"
                                headers: {
        "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
    }
                            }
                        )
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(result) {

                            if (!result.success) {
                                alert("Review could not be deleted.");
                                return;
                            }

                            alert("Review deleted successfully.");

                            loadAdminReviews();

                        })
                        .catch(function(error) {

                            console.error(error);

                            alert(
                                "Could not connect to the review server."
                            );

                        });

                    });

                });

            })
            .catch(function(error) {

                console.error(error);

                adminReviews.innerHTML =
                    "<p>Could not load reviews.</p>";

            });
    }

    loadAdminReviews();
}
// =========================
// ADMIN LOGIN
// =========================

const adminLoginForm =
    document.getElementById("admin-login-form");

const adminLoginMessage =
    document.getElementById("admin-login-message");

if (adminLoginForm) {

    adminLoginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const username =
            document.getElementById("admin-username").value.trim();

        const password =
            document.getElementById("admin-password").value;

        fetch("/api/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {

            if (!result.success) {

                adminLoginMessage.textContent =
                    result.message || "Invalid login.";

                adminLoginMessage.style.color = "#b23b3b";

                return;
            }

            localStorage.setItem(
                "adminToken",
                result.token
            );

            window.location.href = "admin.html";

        })
        .catch(function(error) {

            console.error(error);

            adminLoginMessage.textContent =
                "Could not connect to the server.";

            adminLoginMessage.style.color = "#b23b3b";

        });

    });

}
// =========================
// ADMIN PAGE PROTECTION
// =========================

if (window.location.pathname.toLowerCase().endsWith("admin.html")) {

    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {

        window.location.href = "admin-login.html";

    } else {

        fetch("/api/admin/verify", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + adminToken
            }
        })
        .then(function(response) {

            if (!response.ok) {
                throw new Error("Invalid admin session");
            }

            return response.json();

        })
        .then(function(result) {

            if (!result.success) {
                throw new Error("Invalid admin session");
            }

        })
        .catch(function(error) {

            console.error(error);

            localStorage.removeItem("adminToken");

            window.location.href = "admin-login.html";

        });

    }

}