const mongoose = require('mongoose');
const Cabin = require('../models/cabin.model');
const Guest = require('../models/guest.model');
// Validation functions
exports.validateMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

// Validate cabin, guest, booking and setting  bodies
exports.validateBookingBody = async (body) => {
    const requiredFields = ['startDate', 'endDate', 'numNights', 'numGuests', 'cabinPrice', 'totalPrice', 'cabinId', 'guestId'];
    const missingFields = requiredFields.filter(field => !body[field]);

    const cabin = await Cabin.findById(body.cabinId);
    if(!cabin) {
        return {
            isValid: false,
            error: 'Cabin not found'
        };
    }
    if (cabin && cabin.maxCapacity < body.numGuests) {
        return {
            isValid: false,
            error: 'Number of guests exceeds the maximum capacity of the cabin'
        };
    }
    const guest = await Guest.findById(body.guestId);
    if(!guest) {
        return {
            isValid: false,
            error: 'Guest not found'
        };
    }

    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
            isValid: false,
            error: 'Invalid date format'
        };
    }

    if (endDate <= startDate) {
        return {
            isValid: false,
            error: 'End date must be after start date'
        };
    }

    // Validate numbers
    if (body.numNights < 1 || body.numGuests < 1 || body.cabinPrice < 0 || body.totalPrice < 0) {
        return {
            isValid: false,
            error: 'Invalid numeric values'
        };
    }

    return { isValid: true };
};

exports.validateCabinBody = (body) => {
    const requiredFields = ['name', 'description', 'regularPrice', 'maxCapacity', 'image'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate numeric values
    if (body.regularPrice < 0) {
        return {
            isValid: false,
            error: 'Regular price must be a positive number'
        };
    }

    if (body.maxCapacity < 1) {
        return {
            isValid: false,
            error: 'Maximum capacity must be at least 1'
        };
    }

    if (body.discount && body.discount < 0) {
        return {
            isValid: false,
            error: 'Discount cannot be negative'
        };
    }

    return { isValid: true };
};

exports.validateGuestBody = (body) => {
    const requiredFields = ['fullName', 'email', 'nationality', 'countryFlag', 'nationalID', 'phoneNumber', 'address'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
        return {
            isValid: false,
            error: 'Invalid email format'
        };
    }

    // Validate phone number (basic format check)
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(body.phoneNumber)) {
        return {
            isValid: false,
            error: 'Invalid phone number format. Must be at least 8 digits and may include +, spaces, or hyphens'
        };
    }

    return { isValid: true };
};

exports.validateSettingBody = (body) => {
    const requiredFields = ['minBookingLength', 'maxBookingLength', 'maxGuestsPerBooking', 'breakfastPrice'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    // Validate numeric values
    if (body.minBookingLength < 1) {
        return {
            isValid: false,
            error: 'Minimum booking length must be at least 1 night'
        };
    }

    if (body.maxBookingLength < 1) {
        return {
            isValid: false,
            error: 'Maximum booking length must be at least 1 night'
        };
    }

    if (body.maxBookingLength < body.minBookingLength) {
        return {
            isValid: false,
            error: 'Maximum booking length must be greater than or equal to minimum booking length'
        };
    }

    if (body.maxGuestsPerBooking < 1) {
        return {
            isValid: false,
            error: 'Maximum guests per booking must be at least 1'
        };
    }

    if (body.breakfastPrice < 0) {
        return {
            isValid: false,
            error: 'Breakfast price cannot be negative'
        };
    }

    return { isValid: true };
};


// Validate user registration body
exports.validateUserRegistrationBody = (body) => {
    const errors = [];
    const { name, email, password } = body;

    // 1. Check required fields
    if (!name || typeof name !== "string" || !name.trim()) {
        errors.push("Name is required and must be a non-empty string");
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        errors.push("Email is required");
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        errors.push("Password is required");
    }

    // 2. Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push("Invalid email format");
    }

    // 3. Validate password strength (minimum length example)
    if (password && password.trim().length < 6) {
        errors.push("Password must be at least 6 characters long");
    }

    return {
        isValid: errors.length === 0,
        errors,
        errorMessage: errors.length > 1 ? errors.join(", ") : errors[0] || null,
    };
};
