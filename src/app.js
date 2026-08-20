require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDatabase = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

// ==========================================
// Middleware
// ==========================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ==========================================
// Routes
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Ganpati Pavti Management System API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ganpati Pavti API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// ==========================================
// 404 Handler
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// Global Error Handler
// ==========================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ==========================================
// Start Server
// ==========================================

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log("======================================");
    console.log("   Ganpati vargani Management System");
    console.log("======================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(
      `Environment: ${process.env.NODE_ENV || "development"}`
    );
    console.log("======================================");
  });
};

startServer();