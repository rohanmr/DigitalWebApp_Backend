require("dotenv").config();

const mongoose = require("mongoose");

const connectDatabase = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await connectDatabase();

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin already exists.");

      process.exit(0);
    }

    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      mobile: "9999999999",
      password: "Admin@123",
      role: "admin",
      isActive: true,
    });

    console.log("=================================");
    console.log("Admin created successfully");
    console.log("=================================");
    console.log(`Email: ${admin.email}`);
    console.log(`Mobile: ${admin.mobile}`);
    console.log("=================================");

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:");
    console.error(error.message);

    process.exit(1);
  }
};

createAdmin();