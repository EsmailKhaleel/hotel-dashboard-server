const Guest = require('../models/guest.model');
const { errorResponse } = require('../utils/response.utils');
const { validateMongoId, validateGuestBody } = require('../utils/validators');

// Get all guests
exports.getAllGuests = async (req, res) => {
    try {
        const guests = await Guest.find({}).lean();
        res.status(200).json({
            status: true,
            guests: guests
        });
    } catch (err) {
        return errorResponse(res, "Error retrieving guests", 500);
    }
};

// Get single guest
exports.getGuest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validateMongoId(id)) {
            return errorResponse(res, "Invalid guest ID format", 400);
        }

        const guest = await Guest.findById(id);
        if (!guest) {
            return errorResponse(res, "Guest not found", 404);
        }
        res.status(200).json({
            status: true,
            guest: guest
        });
    } catch (err) {
        return errorResponse(res, "Error retrieving guest", 500);
    }
};

// Create guest
exports.createGuest = async (req, res) => {
    try {
        const validation = validateGuestBody(req.body);
        if (!validation.isValid) {
            return errorResponse(res, validation.error, 400);
        }

        // Check if email is already registered
        const existingGuest = await Guest.findOne({ email: req.body.email });
        if (existingGuest) {
            return errorResponse(res, "A guest with this email already exists", 400);
        }

        const guest = new Guest(req.body);
        await guest.save();
        res.status(201).json({
            status: true,
            guest: guest
        });
    } catch (err) {
        return errorResponse(res, err.message || "Error creating guest", 400);
    }
};

// Update guest
exports.updateGuest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validateMongoId(id)) {
            return errorResponse(res, "Invalid guest ID format", 400);
        }

        // If updating any fields, validate them
        if (Object.keys(req.body).length > 0) {
            const existingGuest = await Guest.findById(id);
            if (!existingGuest) {
                return errorResponse(res, "Guest not found", 404);
            }

            // Check email uniqueness if it's being updated
            if (req.body.email && req.body.email !== existingGuest.email) {
                const emailExists = await Guest.findOne({ 
                    email: req.body.email,
                    _id: { $ne: id }
                });
                if (emailExists) {
                    return errorResponse(res, "A guest with this email already exists", 400);
                }
            }

            // Create a merged object for validation
            const mergedData = { ...existingGuest.toObject(), ...req.body };
            const validation = validateGuestBody(mergedData);
            if (!validation.isValid) {
                return errorResponse(res, validation.error, 400);
            }
        }

        const guest = await Guest.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!guest) {
            return errorResponse(res, "Guest not found", 404);
        }
        res.status(200).json({
            status: true,
            guest: guest
        });
    } catch (err) {
        return errorResponse(res, err.message || "Error updating guest", 400);
    }
};

// Delete guest
exports.deleteGuest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validateMongoId(id)) {
            return errorResponse(res, "Invalid guest ID format", 400);
        }

        const guest = await Guest.findByIdAndDelete(id);
        if (!guest) {
            return errorResponse(res, "Guest not found", 404);
        }
        res.status(200).json({
            status: true,
            message: "Guest deleted successfully"
        });
    } catch (err) {
        return errorResponse(res, "Error deleting guest", 500);
    }
};
