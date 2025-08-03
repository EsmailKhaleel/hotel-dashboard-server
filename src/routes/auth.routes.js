const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  update,
  updatePassword,
  uploadImage,
  refreshToken,
  logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../utils/helper");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes
router.use(protect);

router.get("/me", getMe);
router.put("/update", update);
router.put("/updatepassword", updatePassword);
router.post("/uploadimage", upload, uploadImage);

module.exports = router;
