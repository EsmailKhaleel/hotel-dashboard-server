const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    numNights: {
        type: Number,
        default: 1,
        min: 1,
    },
    numGuests: {
        type: Number,
        required: true,
        min: 1
    },
    cabinPrice: {
        type: Number,
        required: true,
        min: 0
    },
    extrasPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['unconfirmed', 'confirmed', 'checked-in', 'checked-out'],
        default: 'unconfirmed'
    },
    hasBreakfast: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentIntentId: {
        type: String,
        trim: true
    },
    observations: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    cabinId: {
        type: Schema.Types.ObjectId,
        ref: 'Cabin',
        required: true
    },
    guestId: {
        type: Schema.Types.ObjectId,
        ref: 'Guest',
        required: true
    }
}, { timestamps: true });

bookingSchema.plugin(mongoosePaginate);


const bookingModel = mongoose.model('Booking', bookingSchema);

module.exports = bookingModel; 