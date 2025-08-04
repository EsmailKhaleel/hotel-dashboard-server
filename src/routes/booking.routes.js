const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    getBookingsAfterDate,
    getStaysAfterDate,
    getStaysTodayActivity,
    getBookingsDatesByCabinId,
    getReservationsByGuestId,
    updatePaymentStatus
} = require('../controllers/booking.controller');

// Get all bookings
router.get('/', getAllBookings);

// Get single booking
router.get('/:id', getBooking);

// Create new booking
router.post('/', createBooking);

// Update booking
router.patch('/:id', updateBooking);


// Delete booking
router.delete('/:id', deleteBooking);

// Update booking status
router.patch('/:id/status', updateBookingStatus);

// Update payment status
router.patch('/:id/payment-status', updatePaymentStatus);

// Get bookings after a specific date
// expects ?date=ISODate
router.get('/after-date', getBookingsAfterDate); 

// Get stays after a specific date
// expects ?date=ISODate
router.get('/stays-after-date', getStaysAfterDate); 

// Get getStaysTodayActivity
router.get('/stays-today-activity', getStaysTodayActivity);

// Get booking dates by cabin ID
router.get('/:id/dates', getBookingsDatesByCabinId);

// Get reservations by guest ID
router.get('/guest/:id/reservations', getReservationsByGuestId);

module.exports = router;
