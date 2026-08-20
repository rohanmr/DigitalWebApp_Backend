require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

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

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

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

app.get("/api/test-user-model", async (req, res) => {
  try {
    const user = await User.create({
      name: "Test Admin",
      email: "testadmin@example.com",
      mobile: "9999999999",
      password: "temporary-password",
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "User model is working",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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