const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");

// ==========================================
// Create Donation
// ==========================================

const createDonation = async (req, res) => {
    try {
        const {
            donorName,
            mobile,
            address,
            promisedAmount,
            receivedAmount,
            paymentStatus,
            paymentMode,
            entryDate,
            expectedPaymentDate,
            paymentDate,
            remarks,
        } = req.body;

        if (!donorName || !mobile || !promisedAmount) {
            return res.status(400).json({
                success: false,
                message: "Donor name, mobile and amount are required",
            });
        }

        const promised = Number(promisedAmount);

        if (!Number.isFinite(promised) || promised <= 0) {
            return res.status(400).json({
                success: false,
                message: "Promised amount must be greater than 0",
            });
        }

        let received = Number(receivedAmount || 0);
        let status = paymentStatus || "PENDING";

        // Direct payment
        if (status === "PAID") {
            if (!received) {
                received = promised;
            }

            if (received !== promised) {
                return res.status(400).json({
                    success: false,
                    message: "Paid donation must have full received amount",
                });
            }
        }

        // Partial payment
        if (status === "PARTIALLY_PAID") {
            if (received <= 0 || received >= promised) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Partially paid donation must have a received amount less than promised amount",
                });
            }
        }

        // Pending donation
        if (status === "PENDING") {
            received = 0;
        }

        const remaining = Math.max(promised - received, 0);

        const donation = await Donation.create({
            donorName,
            mobile,
            address,
            promisedAmount: promised,
            receivedAmount: received,
            remainingAmount: remaining,
            paymentStatus: status,
            paymentMode:
                status === "PENDING" ? null : paymentMode || null,
            entryDate: entryDate || new Date(),
            expectedPaymentDate:
                status === "PAID"
                    ? null
                    : expectedPaymentDate || null,
            paymentDate:
                status === "PAID"
                    ? paymentDate || new Date()
                    : null,
            remarks,
            collectedBy: req.user._id,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Donation created successfully",
            data: donation,
        });
    } catch (error) {
        console.error("Create donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create donation",
        });
    }
};

// ==========================================
// Get Donations
// ==========================================

const getDonations = async (req, res) => {
    try {
        const {
            status,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const query = {};

        // Volunteers only see their own donations
        if (req.user.role === "volunteer") {
            query.collectedBy = req.user._id;
        }

        if (status) {
            query.paymentStatus = status;
        }

        if (search) {
            query.$or = [
                {
                    donorName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    mobile: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        const pageNumber = Math.max(Number(page), 1);
        const pageSize = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * pageSize;

        const [donations, total] = await Promise.all([
            Donation.find(query)
                .populate("collectedBy", "name mobile role")
                .populate("createdBy", "name role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),

            Donation.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            message: "Donations fetched successfully",
            data: donations,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Get donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch donations",
        });
    }
};

// ==========================================
// Get Single Donation
// ==========================================

const getDonationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(id)
            .populate("collectedBy", "name mobile role")
            .populate("createdBy", "name role");

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        // Volunteer can only view own donation
        if (
            req.user.role === "volunteer" &&
            donation.collectedBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to view this donation",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Donation fetched successfully",
            data: donation,
        });
    } catch (error) {
        console.error("Get donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch donation",
        });
    }
};

// ==========================================
// Update Donation
// ==========================================

const updateDonation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        const isOwner =
            donation.collectedBy.toString() === req.user._id.toString();

        // Volunteer can only edit own donation
        if (req.user.role === "volunteer" && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own donations",
            });
        }

        // Volunteer cannot change sensitive paid receipt data
        if (
            req.user.role === "volunteer" &&
            donation.receiptGenerated
        ) {
            const protectedFields = [
                "promisedAmount",
                "receivedAmount",
                "remainingAmount",
                "paymentStatus",
                "paymentMode",
                "paymentDate",
            ];

            const changedProtectedField = protectedFields.some(
                (field) =>
                    req.body[field] !== undefined &&
                    String(req.body[field]) !== String(donation[field])
            );

            if (changedProtectedField) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Paid donation details cannot be changed after receipt generation",
                });
            }
        }

        const allowedFields = [
            "donorName",
            "mobile",
            "address",
            "promisedAmount",
            "receivedAmount",
            "paymentStatus",
            "paymentMode",
            "entryDate",
            "expectedPaymentDate",
            "paymentDate",
            "remarks",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                donation[field] = req.body[field];
            }
        });

        const promised = Number(donation.promisedAmount);
        let received = Number(donation.receivedAmount || 0);

        if (donation.paymentStatus === "PAID") {
            received = promised;
            donation.receivedAmount = received;
            donation.remainingAmount = 0;

            if (!donation.paymentDate) {
                donation.paymentDate = new Date();
            }
        }

        if (donation.paymentStatus === "PENDING") {
            donation.receivedAmount = 0;
            donation.remainingAmount = promised;
            donation.paymentDate = null;
            donation.paymentMode = null;
        }

        if (donation.paymentStatus === "PARTIALLY_PAID") {
            if (received <= 0 || received >= promised) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid partially paid amount",
                });
            }

            donation.remainingAmount = promised - received;
        }

        await donation.save();

        return res.status(200).json({
            success: true,
            message: "Donation updated successfully",
            data: donation,
        });
    } catch (error) {
        console.error("Update donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update donation",
        });
    }
};

// ==========================================
// Mark Donation as Paid
// ==========================================

const markDonationAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { receivedAmount, paymentMode, paymentDate } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        const isOwner =
            donation.collectedBy.toString() === req.user._id.toString();

        if (req.user.role === "volunteer" && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own donations",
            });
        }

        if (donation.paymentStatus === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cancelled donation cannot be marked as paid",
            });
        }

        const amountToReceive = Number(
            receivedAmount || donation.remainingAmount
        );

        if (amountToReceive <= 0) {
            return res.status(400).json({
                success: false,
                message: "Received amount must be greater than 0",
            });
        }

        const totalReceived =
            donation.receivedAmount + amountToReceive;

        if (totalReceived > donation.promisedAmount) {
            return res.status(400).json({
                success: false,
                message:
                    "Received amount cannot be greater than promised amount",
            });
        }

        // Fully paid
        if (totalReceived === donation.promisedAmount) {
            donation.receivedAmount = donation.promisedAmount;
            donation.remainingAmount = 0;
            donation.paymentStatus = "PAID";
            donation.paymentMode = paymentMode || donation.paymentMode;
            donation.paymentDate = paymentDate || new Date();
        } else {
            // Still partially paid
            donation.receivedAmount = totalReceived;
            donation.remainingAmount =
                donation.promisedAmount - totalReceived;
            donation.paymentStatus = "PARTIALLY_PAID";
            donation.paymentMode = paymentMode || donation.paymentMode;
        }

        await donation.save();

        return res.status(200).json({
            success: true,
            message:
                donation.paymentStatus === "PAID"
                    ? "Donation marked as paid"
                    : "Payment updated successfully",
            data: donation,
        });
    } catch (error) {
        console.error("Mark paid error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update payment",
        });
    }
};

// ==========================================
// Delete Donation
// ==========================================

const deleteDonation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID",
            });
        }

        const donation = await Donation.findById(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }

        // Only admin can delete
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can delete donations",
            });
        }

        if (donation.receiptGenerated) {
            return res.status(400).json({
                success: false,
                message:
                    "Donation with generated receipt cannot be deleted",
            });
        }

        await Donation.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Donation deleted successfully",
        });
    } catch (error) {
        console.error("Delete donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete donation",
        });
    }
};

module.exports = {
    createDonation,
    getDonations,
    getDonationById,
    updateDonation,
    markDonationAsPaid,
    deleteDonation,
};