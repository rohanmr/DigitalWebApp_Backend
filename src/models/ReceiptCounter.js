const mongoose = require("mongoose");

const receiptCounterSchema = new mongoose.Schema(
    {
        year: {
            type: Number,
            required: true,
            unique: true,
        },

        sequence: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const ReceiptCounter = mongoose.model(
    "ReceiptCounter",
    receiptCounterSchema
);

module.exports = ReceiptCounter;