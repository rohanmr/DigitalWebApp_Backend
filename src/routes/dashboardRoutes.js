const express = require("express");

const {
  getDashboardSummary,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// Admin Dashboard
// ==========================================

router.get(
  "/summary",
  authMiddleware,
  authorizeRoles("admin"),
  getDashboardSummary
);

module.exports = router;