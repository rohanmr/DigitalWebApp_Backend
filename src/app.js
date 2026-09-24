require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const donationRoutes = require("./routes/donationRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const receiptRoutes = require("./routes/receiptRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
// const FRONTEND_URL =
//   process.env.FRONTEND_URL || "http://localhost:3000";

// // ==========================================
// // Middleware
// // ==========================================

// app.use(
//   cors({
//     origin: FRONTEND_URL,
//     credentials: true,
//   })
// );
const allowedOrigins = [
  "http://localhost:5000",
  "http://172.20.10.2:5173",
  "http://192.168.1.11:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, curl, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/receipts", receiptRoutes);


// ==========================================
// Routes
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Ganpati Donation Management System API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pavnara Ganpati API is running",
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

  // app.listen(PORT, () => {
  //   console.log("======================================");
  //   console.log("   Ganpati vargani Management System");
  //   console.log("======================================");
  //   console.log(`Server: http://localhost:${PORT}`);
  //   console.log(
  //     `Environment: ${process.env.NODE_ENV || "development"}`
  //   );
  //   console.log("======================================");
  // });
  app.listen(PORT, "0.0.0.0", () => {
    console.log("======================================");
    console.log("   Ganpati Vargani Management System");
    console.log("======================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Network: http://192.168.1.11:${PORT}`);
    console.log(
      `Environment: ${process.env.NODE_ENV || "development"}`
    );
    console.log("======================================");
  });
};

startServer();