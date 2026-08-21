const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
    {
        donorName: {
            type: String,
            required: [true, "Donor name is required"],
            trim: true,
            minlength: [2, "Donor name must be at least 2 characters"],
            maxlength: [100, "Donor name cannot exceed 100 characters"],
        },

        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
            match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
        },

        address: {
            type: String,
            trim: true,
            maxlength: [250, "Address cannot exceed 250 characters"],
            default: "",
        },

        promisedAmount: {
            type: Number,
            required: [true, "Promised amount is required"],
            min: [1, "Amount must be greater than 0"],
        },

        receivedAmount: {
            type: Number,
            default: 0,
            min: [0, "Received amount cannot be negative"],
        },

        remainingAmount: {
            type: Number,
            default: 0,
            min: [0, "Remaining amount cannot be negative"],
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"],
            default: "PENDING",
        },

        paymentMode: {
            type: String,
            enum: ["CASH", "UPI", "OTHER", null],
            default: null,
        },

        entryDate: {
            type: Date,
            default: Date.now,
        },

        expectedPaymentDate: {
            type: Date,
            default: null,
        },

        paymentDate: {
            type: Date,
            default: null,
        },

        remarks: {
            type: String,
            trim: true,
            maxlength: [500, "Remarks cannot exceed 500 characters"],
            default: "",
        },

        receiptNumber: {
            type: String,
            unique: true,
            sparse: true,
        },

        receiptGenerated: {
            type: Boolean,
            default: false,
        },

        receiptGeneratedAt: {
            type: Date,
            default: null,
        },

        collectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
