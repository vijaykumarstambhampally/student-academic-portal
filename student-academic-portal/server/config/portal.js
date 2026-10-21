/**
 * Fixed, hard-coded SCCE portal endpoints.
 *
 * IMPORTANT: These URLs are NOT user-configurable. The student only ever
 * supplies a Hall Ticket Number — never a URL. If the SCCE portal address
 * changes in the future, update it only here.
 *
 * Confirmed from real browser traffic (DevTools Network tab):
 *
 *  Attendance — 3-step, session-based flow:
 *    1. GET  /parentm/index.php        -> issues a PHPSESSID cookie
 *    2. POST /parentm/index.php        -> body: HallticketNo=<value>&submit=Login
 *    3. GET  /parentm/updateddata.php  -> (same cookie) returns the report HTML
 *
 *  Result — 2-step, session-based flow, but both steps hit the SAME url:
 *    1. GET  /result/index.php  -> issues a PHPSESSID cookie (blank form)
 *    2. POST /result/index.php  -> body: htno=<value>&resultstu=Results
 *                                   (same cookie) returns the full result
 *                                   HTML directly — no further redirect.
 */

const PORTAL = {
  attendance: {
    login: "https://scce.ac.in/parentm/index.php",
    data: "https://scce.ac.in/parentm/updateddata.php",
    daily: "https://scce.ac.in/parentm/Dailywisereport.php",
  },
  result: {
    page: "https://scce.ac.in/result/index.php",
    referer: "https://scce.ac.in/result/",
  },
};

module.exports = PORTAL;
