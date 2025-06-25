const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guestSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  countryFlag: {
    type: String,
    required: true,
    trim: true
  },
  nationalID: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Pre-remove hook to delete associated bookings
guestSchema.pre('remove', async function(next) {
  await Booking.deleteMany({ guestId: this._id });
  next();
});

module.exports = mongoose.model('Guest', guestSchema);