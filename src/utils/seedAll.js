const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const Cabin = require("../models/cabin.model");
const Guest = require("../models/guest.model");
const Booking = require("../models/booking.model");
const Setting = require("../models/setting.model");
const {
  isPast,
  isToday,
  isFuture,
  differenceInDays,
  parseISO,
} = require("date-fns");
require("dotenv").config();

const cabinData = require("../../public/data/data-cabins.js");
const guestData = require("../../public/data/data-guests.js");
const bookingData = require("../../public/data/data-bookings.js");
// Array of local image paths
const cabinImages = [
  "public/img/cabin-001.jpg",
  "public/img/cabin-002.jpg",
  "public/img/cabin-003.jpg",
  "public/img/cabin-004.jpg",
  "public/img/cabin-005.jpg",
  "public/img/cabin-006.jpg",
  "public/img/cabin-007.jpg",
  "public/img/cabin-008.jpg",
];

// Function to upload image to Cloudinary
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "wild-oasis/cabins",
      use_filename: true,
      unique_filename: true,
    });
    console.log(`Successfully uploaded ${imagePath} to Cloudinary`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading image ${imagePath}:`, error);
    return null;
  }
};

const subtractDates = (dateStr1, dateStr2) =>
  differenceInDays(parseISO(String(dateStr1)), parseISO(String(dateStr2)));

const seedAll = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data for guests and bookings
    // await Guest.deleteMany({});
    // console.log('Cleared existing guests');
    await Booking.deleteMany({});
    console.log("Cleared existing bookings");

    // Upload images to Cloudinary and create cabin data with URLs
    // console.log('Starting image uploads to Cloudinary...');
    // const cabinsWithImages = await Promise.all(
    //   cabinData.map(async (cabin, index) => {
    //     const imageUrl = await uploadImage(cabinImages[index]);
    //     if (!imageUrl) {
    //       throw new Error(`Failed to upload image for cabin: ${cabin.name}`);
    //     }
    //     return {
    //       ...cabin,
    //       image: imageUrl
    //     };
    //   })
    // );
    // console.log('Finished uploading images to Cloudinary');

    // Insert cabins and guests, keep their ids for mapping
    // const insertedCabins = await Cabin.insertMany(cabinsWithImages);
    // console.log(`Inserted ${insertedCabins.length} cabins`);
    // const insertedGuests = await Guest.insertMany(guestData);
    // console.log(`Inserted ${insertedGuests.length} guests`);
    const existingCabins = await Cabin.find({});
    // Sort to match the order in cabinData
    const sortedCabins = cabinData.map((cd) =>
      existingCabins.find((ec) => ec.name === cd.name)
    );
    console.log("Sorted cabins:", sortedCabins);
    const existingGuests = await Guest.find({});

    // Map 1-based index to MongoDB _id for cabins and guests
    const cabinIdMap = {};
    sortedCabins.forEach((cabin, idx) => {
      cabinIdMap[idx + 1] = cabin._id;
    });
    const guestIdMap = {};
    existingGuests.forEach((guest, idx) => {
      guestIdMap[idx + 1] = guest._id;
    });

    const bookingsToInsert = bookingData.map((b) => {
      const cabin = existingCabins.find(
        (c) => c._id.toString() === cabinIdMap[b.cabinId].toString()
      );
      const startDate = b.startDate;
      const endDate = b.endDate;
      const numNights = subtractDates(endDate, startDate);
      const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
      const extrasPrice = b.hasBreakfast ? numNights * 15 * b.numGuests : 0;
      const totalPrice = cabinPrice + extrasPrice;
      let status;
      if (isPast(parseISO(endDate)) && !isToday(parseISO(endDate)))
        status = "checked-out";
      else if (isFuture(parseISO(startDate)) || isToday(parseISO(startDate)))
        status = "unconfirmed";
      else if (
        (isFuture(parseISO(endDate)) || isToday(parseISO(endDate))) &&
        isPast(parseISO(startDate)) &&
        !isToday(parseISO(startDate))
      )
        status = "checked-in";
      return {
        ...b,
        cabinId: cabinIdMap[b.cabinId],
        guestId: guestIdMap[b.guestId],
        startDate,
        endDate,
        numNights,
        cabinPrice,
        extrasPrice,
        totalPrice,
        status,
      };
    });

    // Insert bookings
    const insertedBookings = await Booking.insertMany(bookingsToInsert);
    console.log(`Inserted ${insertedBookings.length} bookings`);

    console.log("All data seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Run the seed function
seedAll();
