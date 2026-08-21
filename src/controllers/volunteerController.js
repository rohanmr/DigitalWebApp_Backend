const mongoose = require("mongoose");
const User = require("../models/User");

// ==========================================
// Create Volunteer
// ==========================================

const createVolunteer = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { mobile: mobile.trim() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email.toLowerCase().trim()
            ? "Email already exists"
            : "Mobile number already exists",
      });
    }

    const volunteer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      password,
      role: "volunteer",
      isActive: true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Volunteer created successfully",
      data: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        mobile: volunteer.mobile,
        role: volunteer.role,
        isActive: volunteer.isActive,
        createdAt: volunteer.createdAt,
      },
    });
  } catch (error) {
    console.error("Create volunteer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create volunteer",
    });
  }
};

// ==========================================
// Get All Volunteers
// ==========================================

const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: "volunteer",
    })
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Volunteers fetched successfully",
      data: volunteers,
    });
  } catch (error) {
    console.error("Get volunteers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch volunteers",
    });
  }
};

// ==========================================
// Get Volunteer By ID
// ==========================================

const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer ID",
      });
    }

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
    })
      .select("-password")
      .populate("createdBy", "name email");

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Volunteer fetched successfully",
      data: volunteer,
    });
  } catch (error) {
    console.error("Get volunteer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer",
    });
  }
};

// ==========================================
// Update Volunteer
// ==========================================

const updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      mobile,
      password,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer ID",
      });
    }

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    if (email && email.toLowerCase().trim() !== volunteer.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      volunteer.email = email.toLowerCase().trim();
    }

    if (mobile && mobile.trim() !== volunteer.mobile) {
      const mobileExists = await User.findOne({
        mobile: mobile.trim(),
        _id: { $ne: id },
      });

      if (mobileExists) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already exists",
        });
      }

      volunteer.mobile = mobile.trim();
    }

    if (name !== undefined) {
      volunteer.name = name.trim();
    }

    if (password) {
      volunteer.password = password;
    }

    if (isActive !== undefined) {
      volunteer.isActive = Boolean(isActive);
    }

    await volunteer.save();

    return res.status(200).json({
      success: true,
      message: "Volunteer updated successfully",
      data: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        mobile: volunteer.mobile,
        role: volunteer.role,
        isActive: volunteer.isActive,
        updatedAt: volunteer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update volunteer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update volunteer",
    });
  }
};

// ==========================================
// Activate / Deactivate Volunteer
// ==========================================

const updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid volunteer ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const volunteer = await User.findOne({
      _id: id,
      role: "volunteer",
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found",
      });
    }

    volunteer.isActive = isActive;

    await volunteer.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Volunteer activated successfully"
        : "Volunteer deactivated successfully",
      data: {
        id: volunteer._id,
        name: volunteer.name,
        isActive: volunteer.isActive,
      },
    });
  } catch (error) {
    console.error("Update volunteer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update volunteer status",
    });
  }
};

module.exports = {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  updateVolunteerStatus,
};