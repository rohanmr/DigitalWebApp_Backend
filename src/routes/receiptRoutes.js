const express = require("express");

const {
    generateReceipt,
    getReceiptByDonation,
} = require("../controllers/receiptController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Generate Receipt
// ==========================================

router.post(
    "/generate/:donationId",
    authMiddleware,
    generateReceipt
);

// ==========================================
// Get Receipt
// ==========================================

router.get(
    "/donation/:donationId",
    authMiddleware,
    getReceiptByDonation
);

module.exports = router;