const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("../src/config/db.config");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import routes
const cabinRoutes = require("../src/routes/cabin.routes");
const bookingRoutes = require("../src/routes/booking.routes");
const guestRoutes = require("../src/routes/guest.routes");
const settingRoutes = require("../src/routes/setting.routes");
const authRoutes = require("../src/routes/auth.routes");
const {
  notFound,
  errorHandler,
} = require("../src/middleware/error.middleware");



const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://mern-hotel-admin-dashboard.netlify.app',
      'https://hotel-dashboard-react.vercel.app',
    ];
    const allowedRegex = /^https:\/\/.*\.(netlify\.app|vercel\.app)$/;

    if (!origin || allowedOrigins.includes(origin) || allowedRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
}));


app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cabins", cabinRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/settings", settingRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Wild Oasis Server!</h1>");
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);


// Ensure server starts after database connection
const startServer = async () => {
  try {
    await connectDB(); 
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
