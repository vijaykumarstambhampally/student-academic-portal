/**
 * Thin wrapper around fetch() for talking to the Express backend.
 * Both calls hit /api/*, which Vite proxies to the Express server in dev
 * (see vite.config.js) and which should be reverse-proxied the same way
 * in production.
 */

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const message = data?.error?.message || "Something went wrong.";
    throw new Error(message);
  }

  return data.data;
}

/**
 * @param {string} hallTicket
 * @returns {Promise<{overallPercentage:number, subjects:Array}>}
 */
export const getAttendance = (hallTicket) =>
  postJson("/api/attendance", { hallTicket });

/**
 * @param {string} hallTicket
 * @returns {Promise<{dates: Array<{value:string,label:string}>}>}
 */
export const getAttendanceDates = (hallTicket) =>
  postJson("/api/attendance/dates", { hallTicket });

/**
 * @param {string} hallTicket
 * @param {string} date in YYYY-MM-DD format (from getAttendanceDates)
 * @returns {Promise<{date:string, totalAttended:number, totalConducted:number, periods:Array}>}
 */
export const getDailyAttendance = (hallTicket, date) =>
  postJson("/api/attendance/daily", { hallTicket, date });

/**
 * @param {string} hallTicket
 * @returns {Promise<{student:object, cgpa:number, passedSubjects:number, backlogs:number, semesters:Array}>}
 */
export const getResult = (hallTicket) =>
  postJson("/api/result", { hallTicket });
