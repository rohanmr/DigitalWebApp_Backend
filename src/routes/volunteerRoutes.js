const express = require("express");

const {
    createVolunteer,
    getVolunteers,
    getVolunteerById,
    updateVolunteer,
    updateVolunteerStatus,
    deleteVolunteer
} = require("../controllers/volunteerController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// Volunteer Routes
// ==========================================

router.use(
    authMiddleware,
    authorizeRoles("admin")
);

router.post("/create", createVolunteer);

router.get("/", getVolunteers);

router.get("/:id", getVolunteerById);

router.put("/:id", updateVolunteer);

router.patch("/:id/status", updateVolunteerStatus);

router.delete("/:id", deleteVolunteer);

module.exports = router;