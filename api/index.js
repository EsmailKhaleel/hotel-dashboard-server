const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../src/config/db.config');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const cabinRoutes = require('../src/routes/cabin.routes');
const bookingRoutes = require('../src/routes/booking.routes');
const guestRoutes = require('../src/routes/guest.routes');
const settingRoutes = require('../src/routes/setting.routes');
const authRoutes = require('../src/routes/auth.routes');
const { notFound, errorHandler } = require('../src/middleware/error.middleware');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://mern-hotel-admin-dashboard.netlify.app/"],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cabins', cabinRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/settings', settingRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Wild Oasis Server!</h1>');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something broke!',
        error: err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});