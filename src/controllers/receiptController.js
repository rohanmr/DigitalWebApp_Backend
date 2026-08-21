const mongoose = require("mongoose");

const Donation = require("../models/Donation");
const ReceiptCounter = require("../models/ReceiptCounter");

// ==========================================
// Generate Receipt Number
// ==========================================

const generateReceiptNumber = async () => {
    const currentYear = new Date().getFullYear();

    const counter = await ReceiptCounter.findOneAndUpdate(
        { year: currentYear },
        {
            $inc: {
                sequence: 1,
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    const sequenceNumber = counter.sequence
        .toString()
        .padStart(4, "0");

    return `REC-${currentYear}-${sequenceNumber}`;
};

// ==========================================
// Generate Receipt
// ==========================================

const generateReceipt = async (req, res) => {
    try {
        const { donationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(donationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(donationId)
            .populate("collectedBy", "name mobile role")
            .populate("createdBy", "name role");

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        // ==========================================
        // Volunteer can only generate own receipt
        // ==========================================

        if (req.user.role === "volunteer") {
            const isOwner =
                donation.collectedBy._id.toString() ===
                req.user._id.toString();

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only generate receipts for your own donations",
                });
            }
        }

        // ==========================================
        // Receipt only for fully paid donation
        // ==========================================

        if (donation.paymentStatus !== "PAID") {
            return res.status(400).json({
                success: false,
                message:
                    "Receipt can only be generated for paid donations",
            });
        }

        // ==========================================
        // Receipt already generated
        // ==========================================

        if (
            donation.receiptGenerated &&
            donation.receiptNumber
        ) {
            return res.status(200).json({
                success: true,
                message: "Receipt already generated",
                data: {
                    donation,
                    receiptNumber: donation.receiptNumber,
                    receiptGeneratedAt:
                        donation.receiptGeneratedAt,
                },
            });
        }

        // ==========================================
        // Generate Receipt Number
        // ==========================================

        const receiptNumber =
            await generateReceiptNumber();

        // ==========================================
        // Save Receipt Information
        // ==========================================

        donation.receiptNumber = receiptNumber;
        donation.receiptGenerated = true;
        donation.receiptGeneratedAt = new Date();

        await donation.save();

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Receipt generated successfully",
            data: {
                donation,
                receiptNumber,
                receiptGeneratedAt:
                    donation.receiptGeneratedAt,
            },
        });
    } catch (error) {
        console.error("Generate receipt error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate receipt",
        });
    }
};

// ==========================================
// Get Receipt by Donation
// ==========================================

const getReceiptByDonation = async (req, res) => {
    try {
        const { donationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(donationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(donationId)
            .populate("collectedBy", "name mobile role")
            .populate("createdBy", "name role");

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        // ==========================================
        // Volunteer permission
        // ==========================================

        if (req.user.role === "volunteer") {
            const isOwner =
                donation.collectedBy._id.toString() ===
                req.user._id.toString();

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only view your own receipts",
                });
            }
        }

        if (!donation.receiptGenerated) {
            return res.status(404).json({
                success: false,
                message: "Receipt has not been generated yet",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Receipt fetched successfully",
            data: donation,
        });
    } catch (error) {
        console.error("Get receipt error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch receipt",
        });
    }
};

module.exports = {
    generateReceipt,
    getReceiptByDonation,
};