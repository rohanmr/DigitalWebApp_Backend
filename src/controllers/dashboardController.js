const User = require("../models/User");
const Donation = require("../models/Donation");



const getDashboardSummary = async (req, res) => {
  try {
    const [volunteerCount, donationStats, statusCounts] = await Promise.all([
      // Active volunteer count
      User.countDocuments({ role: "volunteer", isActive: true }),

      // Money totals (exclude cancelled donations from money math)
      Donation.aggregate([
        { $match: { paymentStatus: { $ne: "CANCELLED" } } },
        {
          $group: {
            _id: null,
            totalPromised: { $sum: "$promisedAmount" },
            totalReceived: { $sum: "$receivedAmount" },
            pendingAmount: { $sum: "$remainingAmount" },
            totalDonations: { $sum: 1 },
          },
        },
      ]),

      // Count by payment status (includes cancelled, for a full picture)
      Donation.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = donationStats[0] || {
      totalPromised: 0,
      totalReceived: 0,
      pendingAmount: 0,
      totalDonations: 0,
    };

    const statusBreakdown = {
      PENDING: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      CANCELLED: 0,
    };

    statusCounts.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const dashboardData = {
      totalPromised: stats.totalPromised,
      totalReceived: stats.totalReceived,
      pendingAmount: stats.pendingAmount,
      totalDonations: stats.totalDonations,
      volunteerCount,
      statusBreakdown,
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