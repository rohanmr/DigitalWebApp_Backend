const User = require("../models/User");

// ==========================================
// Get Admin Dashboard Summary
// ==========================================

const getDashboardSummary = async (req, res) => {
  try {
    const volunteerCount = await User.countDocuments({
      role: "volunteer",
      isActive: true,
    });

    const dashboardData = {
      totalReceived: 0,
      pendingAmount: 0,
      totalDonations: 0,
      volunteerCount,
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};

module.exports = {
  getDashboardSummary,
};