const mongoose = require('mongoose');
const Scheme = mongoose.Schema;

const settingSchema = new Scheme({
    minBookingLength: {
        type: Number,
        required: true,
        min: 1
    },
    maxBookingLength: {
        type: Number,
        required: true,
        min: 1
    },
    maxGuestsPerBooking: {
        type: Number,
        required: true,
        min: 1
    },
    breakfastPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);