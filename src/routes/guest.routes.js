const express = require("express");
const router = express.Router();
const {
  getAllGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestByEmail,
  getBookingsByGuestId
} = require("../controllers/guest.controller");
const uploud = require("../utils/helper");

// Get all guests
router.get("/", getAllGuests);

// Get guest by email
router.get("/email/:email", getGuestByEmail);

// Get single guest
router.get("/:id", getGuest);

// Get bookings by guest ID
router.get("/:id/bookings", getBookingsByGuestId);

// Create new guest
router.post("/", createGuest);

// Update guest
router.patch("/:id", uploud, updateGuest);

// Delete guest
router.delete("/:id", deleteGuest);

module.exports = router;
