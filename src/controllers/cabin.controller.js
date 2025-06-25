const Cabin = require('../models/cabin.model');
const { errorResponse } = require('../utils/response.utils');
const { validateMongoId, validateCabinBody } = require('../utils/validators');
const cloudinary = require('../config/cloudinary.js');
const upload = require('../utils/helper.js');

// Get all cabins
exports.getAllCabins = async (req, res) => {
    try {
        const cabins = await Cabin.find({}).lean();
        res.status(200).json({
            status: true,
            cabins: cabins
        });
    } catch (err) {
        return errorResponse(res, "Error retrieving cabins", 500);
    }
};

// Get single cabin
exports.getCabin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validateMongoId(id)) {
            return errorResponse(res, "Invalid cabin ID format", 400);
        }

        const cabin = await Cabin.findById(id);
        if (!cabin) {
            return errorResponse(res, "Cabin not found", 404);
        }
        res.status(200).json({
            status: true,
            cabin: cabin
        });
    } catch (err) {
        return errorResponse(res, "Error retrieving cabin", 500);
    }
};

// Create cabin
exports.createCabin = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return errorResponse(res, err.message, 400);
        }


        try {
            let imageUrl;
            if (req.file) {

                // Convert buffer to base64
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'wild-oasis/cabins',
                    use_filename: true,
                    unique_filename: true,
                });

                imageUrl = result.secure_url;

            } else if (req.body.image) {
                // If image is provided in body, use it directly
                imageUrl = req.body.image;

            } else {
                return errorResponse(res, 'Image is required', 400);
            }
            // Add image to req.body
            req.body.image = imageUrl;

            // Validate input
            const validation = validateCabinBody(req.body);
            if (!validation.isValid) {
                return errorResponse(res, validation.error, 400);
            }

            // Save to DB
            const cabin = new Cabin(req.body);
            await cabin.save();

            res.status(201).json({
                status: true,
                cabin,
            });
        } catch (err) {
            console.error(err);
            return errorResponse(res, err.message || 'Error creating cabin', 500);
        }
    });
};

// Update cabin
exports.updateCabin = async (req, res) => {
    try {
        // If `req.file` exists, process the image
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "wild-oasis/cabins",
                use_filename: true,
                unique_filename: true,
            });
            req.body.image = result.secure_url;
        }

        // Validate id
        const { id } = req.params;
        if (!validateMongoId(id))
            return errorResponse(res, "Invalid cabin ID format", 400);

        // Validate merged data
        const existingCabin = await Cabin.findById(id);
        if (!existingCabin) {
            return errorResponse(res, "Cabin not found", 404);
        }

        const mergedData = { ...existingCabin.toObject(), ...req.body };
        const validation = validateCabinBody(mergedData);
        if (!validation.isValid) {
            return errorResponse(res, validation.error, 400);
        }

        // Perform the update
        const cabin = await Cabin.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!cabin) {
            return errorResponse(res, "Cabin not found", 404);
        }

        res.status(200).json({ status: true, cabin });
    } catch (err) {
        return errorResponse(res, err.message || "Error updating cabin", 400);
    }
};

// Delete cabin
exports.deleteCabin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validateMongoId(id)) {
            return errorResponse(res, "Invalid cabin ID format", 400);
        }

        const cabin = await Cabin.findByIdAndDelete(id);
        if (!cabin) {
            return errorResponse(res, "Cabin not found", 404);
        }
        res.status(200).json({
            status: true,
            message: "Cabin deleted successfully"
        });
    } catch (err) {
        return errorResponse(res, "Error deleting cabin", 500);
    }
};
