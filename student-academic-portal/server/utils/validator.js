/**
 * Validates a Hall Ticket Number before it is ever used in an outbound
 * request to SCCE. Adjust HALL_TICKET_PATTERN to match SCCE's real format
 * once known (e.g. "22B01A0501").
 */

// Placeholder pattern: 8-12 alphanumeric characters, no spaces/symbols.
// Tighten this once the real SCCE hall ticket format is confirmed.
const HALL_TICKET_PATTERN = /^[A-Za-z0-9]{8,12}$/;

/**
 * @param {unknown} hallTicket
 * @returns {{ valid: boolean, message?: string, value?: string }}
 */
function validateHallTicket(hallTicket) {
  if (typeof hallTicket !== "string") {
    return { valid: false, message: "Hall Ticket Number must be text." };
  }

  const trimmed = hallTicket.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: "Hall Ticket Number is required." };
  }

  if (!HALL_TICKET_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message: "Hall Ticket Number format looks invalid.",
    };
  }

  return { valid: true, value: trimmed.toUpperCase() };
}

/**
 * Validates a date string used to request a specific day's attendance.
 * Must match the SCCE dropdown's real value format: YYYY-MM-DD.
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {unknown} date
 * @returns {{ valid: boolean, message?: string, value?: string }}
 */
function validateDate(date) {
  if (typeof date !== "string" || !DATE_PATTERN.test(date.trim())) {
    return { valid: false, message: "Date must be in YYYY-MM-DD format." };
  }
  return { valid: true, value: date.trim() };
}

module.exports = { validateHallTicket, validateDate };
