const mongoose = require('mongoose');
const Cabin = require('../models/cabin.model');
require('dotenv').config();

const cabinData = [
  {
    name: 'Forest Retreat',
    description: 'A cozy cabin nestled in the heart of the forest, perfect for a romantic getaway.',
    regularPrice: 250,
    maxCapacity: 2,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800'
  },
  {
    name: 'Lake View Lodge',
    description: 'Spacious cabin with stunning lake views and modern amenities for the whole family.',
    regularPrice: 400,
    maxCapacity: 6,
    discount: 50,
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800'
  },
  {
    name: 'Mountain Peak Cabin',
    description: 'Luxurious mountain retreat with panoramic views and premium furnishings.',
    regularPrice: 500,
    maxCapacity: 4,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800'
  },
  {
    name: 'Riverside Haven',
    description: 'Peaceful cabin by the river with private dock and fishing access.',
    regularPrice: 300,
    maxCapacity: 3,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800'
  },
  {
    name: 'Family Lodge',
    description: 'Extra large cabin perfect for family reunions and group getaways.',
    regularPrice: 600,
    maxCapacity: 8,
    discount: 100,
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800'
  }
];

const seedCabins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing cabins
    await Cabin.deleteMany({});
    console.log('Cleared existing cabins');

    // Insert new cabins
    const insertedCabins = await Cabin.insertMany(cabinData);
    console.log(`Successfully inserted ${insertedCabins.length} cabins`);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCabins();
