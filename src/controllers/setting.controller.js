const Setting = require('../models/setting.model');
const { errorResponse } = require('../utils/response.utils');
const { validateSettingBody } = require('../utils/validators');

// Get settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findOne();
        if (!settings) {
            //  if no settings exist, return default settings
            res.status(200).json({
                status: true,
                settings: {
                    minBookingLength: 1,
                    maxBookingLength: 30,
                    maxGuestsPerBooking: 10,
                    breakfastPrice: 15
                }
            });
        }
        res.status(200).json({
            status: true,
            settings: settings
        });
    } catch (err) {
        return errorResponse(res, "Error retrieving settings", 500);
    }
};

// Create settings
exports.createSettings = async (req, res) => {
    try {
        // Check if settings already exist
        const existingSettings = await Setting.findOne();
        if (existingSettings) {
            return errorResponse(res, "Settings already exist. Use PATCH to update.", 400);
        }

        const validation = validateSettingBody(req.body);
        if (!validation.isValid) {
            return errorResponse(res, validation.error, 400);
        }

        const settings = new Setting(req.body);
        await settings.save();

        res.status(201).json({
            status: true,
            settings: settings
        });
    } catch (err) {
        return errorResponse(res, err.message || "Error creating settings", 400);
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        
        if (!settings) {
            return errorResponse(res, "Settings not found. Use POST to create new settings.", 404);
        }

        // If updating any fields, validate them
        if (Object.keys(req.body).length > 0) {
            // Create a merged object for validation
            const mergedData = { ...settings.toObject(), ...req.body };
            const validation = validateSettingBody(mergedData);
            if (!validation.isValid) {
                return errorResponse(res, validation.error, 400);
            }
        }
        
        // Update existing settings
        Object.assign(settings, req.body);
        await settings.save();

        res.status(200).json({
            status: true,
            settings: settings
        });
    } catch (err) {
        return errorResponse(res, err.message || "Error updating settings", 400);
    }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
    try {
        const defaultSettings = {
            minBookingLength: 1,
            maxBookingLength: 30,
            maxGuestsPerBooking: 10,
            breakfastPrice: 15
        };

        let settings = await Setting.findOne();
        
        if (!settings) {
            settings = new Setting(defaultSettings);
        } else {
            Object.assign(settings, defaultSettings);
        }
        
        await settings.save();

        res.status(200).json({
            status: true,
            message: "Settings have been reset to default",
            settings: settings
        });
    } catch (err) {
        return errorResponse(res, "Error resetting settings", 500);
    }
};
