const { validateHallTicket } = require("../utils/validator");
const { PortalError, asyncHandler } = require("../utils/errorHandler");
const { fetchResultHtml } = require("../services/collegePortal");
const { parseResult } = require("../parsers/resultParser");

/**
 * POST /api/result
 * Body: { hallTicket: string }
 */
const getResult = asyncHandler(async (req, res) => {
  const { hallTicket } = req.body;

  const validation = validateHallTicket(hallTicket);
  if (!validation.valid) {
    throw new PortalError(validation.message, 400, "INVALID_HALL_TICKET");
  }

  const html = await fetchResultHtml(validation.value);
  const data = parseResult(html, validation.value);

  res.json({ success: true, data });
});

module.exports = { getResult };
