const express = require("express");
const {
  getAttendance,
  getAttendanceDates,
  getDailyAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

// POST /api/attendance          -> overall subject-wise attendance
router.post("/", getAttendance);

// POST /api/attendance/dates    -> list of dates available for daily report
router.post("/dates", getAttendanceDates);

// POST /api/attendance/daily    -> period-wise attendance for one date
router.post("/daily", getDailyAttendance);

module.exports = router;
