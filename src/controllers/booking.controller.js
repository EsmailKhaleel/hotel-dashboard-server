const { isToday, parseISO } = require("date-fns");
const Booking = require("../models/booking.model");
const { errorResponse } = require("../utils/response.utils");
const { validateMongoId, validateBookingBody } = require("../utils/validators");
const Guest = require("../models/guest.model");

// Helper function to get today's date at midnight and end of day
const getToday = function (options = {}) {
  const today = new Date();

  if (options?.end) today.setUTCHours(23, 59, 59, 999);
  else today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
};
// Get today's start and end in UTC
const getTodayRange = () => {
  const now = new Date();
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
  return { start, end };
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

// Get bookings dates by cabin ID
exports.getBookingsDatesByCabinId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid cabin ID format", 400);
    }
    const bookingsDates = await Booking.find({
      cabinId: id,
    })
      .select("startDate endDate")
      .lean();
    console.log("Bookings Dates:", bookingsDates);
    res.status(200).json({
      status: true,
      dates: bookingsDates,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving bookings dates", 500);
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    if (
      !validateMongoId(req.body.cabinId) ||
      !validateMongoId(req.body.guestId)
    ) {
      return errorResponse(res, "Invalid cabin or guest ID format", 400);
    }
    const validation = await validateBookingBody(req.body);
    if (!validation.isValid) {
      return errorResponse(res, validation.error, 400);
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

    if (
      !status ||
      !["unconfirmed", "confirmed", "checked-in", "checked-out"].includes(
        status
      )
    ) {
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

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, paymentIntentId, status } = req.body;

    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid booking ID format", 400);
    }

    const updateData = {};

    if (typeof isPaid === "boolean") {
      updateData.isPaid = isPaid;
    }

    if (paymentIntentId) {
      updateData.paymentIntentId = paymentIntentId;
    }

    if (
      status &&
      ["unconfirmed", "confirmed", "checked-in", "checked-out"].includes(status)
    ) {
      updateData.status = status;
    }

    const booking = await Booking.findByIdAndUpdate(id, updateData, {
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
    return errorResponse(res, "Error updating payment status", 400);
  }
};

// Get bookings created after a specific date
exports.getBookingsAfterDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return errorResponse(res, "Date query parameter is required", 400);

    const from = new Date(date);
    if (Number.isNaN(from.getTime())) return errorResponse(res, "Invalid ISO date", 400);

    const { end } = getTodayRange();

    const bookings = await Booking.find({
      createdAt: { $gte: from, $lte: end }, // use timestamps field
    }).select("createdAt extrasPrice totalPrice").lean();

    res.status(200).json({ status: true, bookings });
  } catch (err) {
    return errorResponse(res, "Error retrieving bookings", 500);
  }
};


// Get stays (confirmed or checked-in bookings) after a specific startDate
exports.getStaysAfterDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return errorResponse(res, "Date query parameter is required", 400);

    const from = new Date(date);
    if (Number.isNaN(from.getTime())) return errorResponse(res, "Invalid ISO date", 400);

    const { start: todayStart } = getTodayRange();

    const stays = await Booking.find({
      startDate: { $gte: from, $lt: todayStart },
      status: { $in: ["checked-out", "checked-in"] },
    }).lean();

    res.status(200).json({ status: true, stays });
  } catch (err) {
    return errorResponse(res, "Error retrieving stays", 500);
  }
};

exports.getStaysTodayActivity = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    // Query directly in MongoDB
    const stays = await Booking.find({
      $or: [
        // Unconfirmed or confirmed starting today
        {
          status: { $in: ["unconfirmed", "confirmed"] },
          startDate: { $gte: start, $lte: end },
        },
        // Checked-in and ending today
        { status: "checked-in", endDate: { $gte: start, $lte: end } },
      ],
    })
      .populate("guestId")
      .lean();

    res.status(200).json({
      status: true,
      activities: stays,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving today's stays", 500);
  }
};

// Get Reservations for a specific guest by guest ID (which are unconfirmed bookings)
exports.getReservationsByGuestId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateMongoId(id)) {
      return errorResponse(res, "Invalid guest ID format", 400);
    }

    const guest = await Guest.findById(id);
    if (!guest) {
      return errorResponse(res, "Guest not found", 404);
    }

    const reservations = await Booking.find({
      guestId: id,
      status: "unconfirmed",
    }).populate("cabinId");

    res.status(200).json({
      status: true,
      reservations,
    });
  } catch (err) {
    return errorResponse(res, "Error retrieving reservations", 500);
  }
};
