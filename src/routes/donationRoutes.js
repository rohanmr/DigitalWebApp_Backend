const express = require("express");

const {
    createDonation,
    getDonations,
    getDonationById,
    updateDonation,
    markDonationAsPaid,
    deleteDonation,
} = require("../controllers/donationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Donation Routes
// ==========================================

router.post("/create", authMiddleware, createDonation);

router.get("/get-all-donations", authMiddleware, getDonations);

router.get("/:id", authMiddleware, getDonationById);

router.put("/:id", authMiddleware, updateDonation);

router.patch("/:id/mark-paid", authMiddleware, markDonationAsPaid);

router.delete("/:id", authMiddleware, deleteDonation);

module.exports = router;
