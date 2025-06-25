const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cabinSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  regularPrice: {
    type: Number,
    required: true,
    min: 0
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  image:{
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// Pre-remove hook to delete associated bookings
cabinSchema.pre('remove', async function(next) {
  await Booking.deleteMany({ cabinId: this._id });
  next();
});

module.exports = mongoose.model('Cabin', cabinSchema);