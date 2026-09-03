const express = require("express");

const {
    login,
    logout,
    getMe,
    updateMe,
    changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Authentication Routes
// ==========================================

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", authMiddleware, getMe);

router.patch("/me", authMiddleware, updateMe);

router.patch("/change-password", authMiddleware, changePassword);

module.exports = router;