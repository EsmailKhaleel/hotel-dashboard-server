const express = require('express');
const router = express.Router();
const {
    getAllGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest
} = require('../controllers/guest.controller');

// Get all guests
router.get('/', getAllGuests);

// Get single guest
router.get('/:id', getGuest);

// Create new guest
router.post('/', createGuest);

// Update guest
router.patch('/:id', updateGuest);

// Delete guest
router.delete('/:id', deleteGuest);

module.exports = router;
