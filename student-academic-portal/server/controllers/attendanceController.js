const { validateHallTicket, validateDate } = require("../utils/validator");
const { PortalError, asyncHandler } = require("../utils/errorHandler");
const {
  fetchAttendanceHtml,
  fetchDailyAttendanceDatesHtml,
  fetchDailyAttendanceReportHtml,
} = require("../services/collegePortal");
const { parseAttendance } = require("../parsers/attendanceParser");
const { parseAvailableDates, parseDailyReport } = require("../parsers/dailyAttendanceParser");

/**
 * POST /api/attendance
 * Body: { hallTicket: string }
 */
const getAttendance = asyncHandler(async (req, res) => {
  const { hallTicket } = req.body;

  const validation = validateHallTicket(hallTicket);
  if (!validation.valid) {
    throw new PortalError(validation.message, 400, "INVALID_HALL_TICKET");
  }

  const html = await fetchAttendanceHtml(validation.value);
  const data = parseAttendance(html);

  res.json({ success: true, data });
});

/**
 * POST /api/attendance/dates
 * Body: { hallTicket: string }
 * Returns the list of dates this student has a daily attendance report for.
 */
const getAttendanceDates = asyncHandler(async (req, res) => {
  const { hallTicket } = req.body;

  const validation = validateHallTicket(hallTicket);
  if (!validation.valid) {
    throw new PortalError(validation.message, 400, "INVALID_HALL_TICKET");
  }

  const html = await fetchDailyAttendanceDatesHtml(validation.value);
  const dates = parseAvailableDates(html);

  res.json({ success: true, data: { dates } });
});

/**
 * POST /api/attendance/daily
 * Body: { hallTicket: string, date: string } (date in YYYY-MM-DD format)
 */
const getDailyAttendance = asyncHandler(async (req, res) => {
  const { hallTicket, date } = req.body;

  const hallTicketValidation = validateHallTicket(hallTicket);
  if (!hallTicketValidation.valid) {
    throw new PortalError(hallTicketValidation.message, 400, "INVALID_HALL_TICKET");
  }

  const dateValidation = validateDate(date);
  if (!dateValidation.valid) {
    throw new PortalError(dateValidation.message, 400, "INVALID_DATE");
  }

  const html = await fetchDailyAttendanceReportHtml(
    hallTicketValidation.value,
    dateValidation.value
  );
  const data = parseDailyReport(html);

  res.json({ success: true, data });
});

module.exports = { getAttendance, getAttendanceDates, getDailyAttendance };
