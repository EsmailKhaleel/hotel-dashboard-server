const User = require("../models/user.model");
const { errorResponse } = require("../utils/response.utils");
const cloudinary = require("../config/cloudinary");
const jwt = require("jsonwebtoken");
const { validateUserRegistrationBody } = require("../utils/validators");

// Helper to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
  );
};

// Helper to get cookie options based on environment
const getCookieOptions = () => ({
  httpOnly: true,
  // If true then cookie will only be sent over HTTPS
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    // Validate request body
    const { isValid, errorMessage } = validateUserRegistrationBody(req.body);
    if (!isValid) {
      return errorResponse(res, errorMessage, 400);
    }

    const { name, email, password, image } = req.body;
    console.log("Registering data:", req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email already registered", 400);
    }
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      image: image ? image : "",
    });

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    user.password = undefined;

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return errorResponse(res, "Please provide email and password", 400);
    }

    // Check for user exists and attach password to query
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    user.password = undefined;

    // Set refresh token as HTTP-only cookie
    // Attach a Set-Cookie header in the HTTP response.
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(200).json({
      status: true,
      message: "User logged in successfully",
      token,
      user,
    });
  } catch (error) {
    errorResponse(res, "Server error", 500);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Not authenticated", 401);
  }
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/update
exports.update = async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body.name && !req.body.email) {
      return errorResponse(res, "Please provide name or email", 400);
    }
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
exports.updatePassword = async (req, res, next) => {
  try {
    if (!req.body.currentPassword || !req.body.newPassword) {
      return errorResponse(res, "Please provide current and new password", 400);
    }
    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return errorResponse(res, "Current password is incorrect", 401);
    }

    user.password = req.body.newPassword;
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: true,
      message: "Password updated successfully",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload user profile image
// @route   POST /api/auth/upload-image
exports.uploadImage = async (req, res, next) => {
  try {
    console.log("Uploading image:", req.file);

    if (!req.file) {
      return errorResponse(res, "Please upload an image file", 400);
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "user_profiles",
      resource_type: "auto",
    });

    // Update user's image URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { image: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: "Image updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return errorResponse(res, "No refresh token provided", 401);
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return errorResponse(res, "Invalid refresh token", 401);
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, "User not found", 401);
    }
    const token = user.generateAuthToken();
    res.status(200).json({
      status: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (clear refresh token)
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", getCookieOptions());
    res.status(200).json({
      status: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};


// sameSite property in cookies
// Controls whether cookies are sent with cross-site requests, helping to prevent CSRF (Cross-Site Request Forgery) attacks.
// Values:
// 'strict':
// The cookie is only sent for requests originating from the same site.
// Cross-site requests (like from another domain) will not include the cookie.
// Most secure, but can break some cross-origin flows (like third-party logins).
// 'lax':
// The cookie is sent for top-level navigations (e.g., clicking a link) and GET requests from other sites, but not for most cross-site POST requests.
// Good balance between security and usability.
// 'none':
// The cookie is sent with all requests, including cross-site requests.
// Requires secure: true (must be HTTPS).
// Needed if your frontend and backend are on different domains and you want cookies to be sent.
