const { isToday, parseISO } = require("date-fns");
const Booking = require("../models/booking.model");
const { errorResponse } = require("../utils/response.utils");
const { validateMongoId, validateBookingBody } = require("../utils/validators");

// Helper function to get today's date at midnight and end of day
const getToday = function (options = {}) {
  const today = new Date();

  if (options?.end)
    today.setUTCHours(23, 59, 59, 999);
  else today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
};

// Get all bookings with populated cabin and guest details
exports.getAllBookings = async (req, res) => {
  const { status, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

  if (isNaN(parseInt(page))) {
    return errorResponse(res, "Invalid page number", 400);
  }
  if (isNaN(parseInt(limit))) {
    return errorResponse(res, "Invalid limit", 400);
  }

  const query = {};
  if (status) query.status = status;

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    populate: ["cabinId", "guestId"],
    lean: true,
  };

  try {
    const bookings = await Booking.paginate(query, options);
    res.status(200).json({
      status: true,
      bookings: bookings.docs,
      total: bookings.totalDocs,
      page: bookings.page,
      limit: bookings.limit,
      totalPages: bookings.totalPages,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving bookings", 500);
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid booking ID format", 400);
    }

    const booking = await Booking.findById(id)
      .populate("cabinId")
      .populate("guestId");
    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }
    res.status(200).json({
      status: true,
      booking: booking,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving booking", 500);
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const validation = validateBookingBody(req.body);
    if (!validation.isValid) {
      return errorResponse(res, validation.error, 400);
    }

    if (
      !validateMongoId(req.body.cabinId) ||
      !validateMongoId(req.body.guestId)
    ) {
      return errorResponse(res, "Invalid cabin or guest ID format", 400);
    }

    const booking = new Booking(req.body);
    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate("cabinId")
      .populate("guestId");
    res.status(201).json({
      status: true,
      booking: populatedBooking,
    });
  } catch (err) {
    return errorResponse(res, err.message || "Error creating booking", 400);
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid booking ID format", 400);
    }

    // If updating IDs, validate them
    if (req.body.cabinId && !validateMongoId(req.body.cabinId)) {
      return errorResponse(res, "Invalid cabin ID format", 400);
    }
    if (req.body.guestId && !validateMongoId(req.body.guestId)) {
      return errorResponse(res, "Invalid guest ID format", 400);
    }

    const booking = await Booking.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("cabinId")
      .populate("guestId");

    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }
    res.status(200).json({
      status: true,
      booking: booking,
    });
  } catch (err) {
    return errorResponse(res, err.message || "Error updating booking", 400);
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid booking ID format", 400);
    }

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }
    res.status(200).json({
      status: true,
      message: "Booking deleted successfully",
    });
  } catch (err) {
    return errorResponse(res, "Error deleting booking", 500);
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid booking ID format", 400);
    }

    if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
      return errorResponse(res, "Invalid status value", 400);
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("cabinId")
      .populate("guestId");

    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    res.status(200).json({
      status: true,
      booking: booking,
    });
  } catch (err) {
    return errorResponse(res, "Error updating booking status", 400);
  }
};

// Get bookings created after a specific date
exports.getBookingsAfterDate = async (req, res) => {
  try {
    //  date must be in ISO format, e.g. 2025-10-01T00:00:00Z
    const { date } = req.query;
    if (!date) {
      return errorResponse(res, "Date query parameter is required", 400);
    }

    const bookings = await Booking.find({
      created_at: {
        $gte: date,
        $lt: getToday({ endOfDay: true }),
      },
    }).select("created_at extrasPrice totalPrice");

    res.status(200).json({
      status: true,
      bookings,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving bookings", 500);
  }
};

// Get stays (confirmed or checked-in bookings) after a specific startDate
exports.getStaysAfterDate = async (req, res) => {
  try {
    // date must be in ISO format, e.g. 2025-10-01T00:00:00Z
    const { date } = req.query;
    if (!date) {
      return errorResponse(res, "Date query parameter is required", 400);
    }
    
    const stays = await Booking.find({
      startDate: { 
        $gte: date,
        $lt: getToday({ endOfDay: false }),
     },
      status: { $in: ["checked-out", "checked-in"] },
    });

    res.status(200).json({
      status: true,
      stays,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving stays", 500);
  }
};

exports.getStaysTodayActivity = async (req, res) => {
  try {
    const today = getToday({ end: false });
    // quer stay that stay.status==="unconfirmed" && isToday(stay.startDate)
    // quer stay that stay.status==="checked-in" && isToday(stay.endDate)
     const stays = await Booking.find({
      status: { $in: ["unconfirmed", "checked-in"] }
    }).populate("guestId").lean();

    const activities = stays.filter(stay =>
      (stay.status === "unconfirmed" && isToday(parseISO(stay.startDate.toISOString()))) ||
      (stay.status === "checked-in" && isToday(parseISO(stay.endDate.toISOString())))
    );

    res.status(200).json({
      status: true,
      activities,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving today's stays", 500);
  }
}
