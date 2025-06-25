const mongoose = require('mongoose');
require('dotenv').config();

// Cache the database connection
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }
  try {
    const mongodbURI = process.env.MONGODB_URI;    
    const conn = await mongoose.connect(mongodbURI);

    // Cache the connection
    cachedConnection = conn;
    console.log(`MongoDB Connected Successfully to: ${conn.connection.host}`);
    return conn;

  } catch (error) {
    console.error('Detailed MongoDB connection error:');
  }
};


// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cachedConnection = null;
});

// If Node process ends, close the MongoDB connection
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

module.exports = connectDB;