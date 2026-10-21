const axios = require("axios");
const PORTAL = require("../config/portal");
const { PortalError } = require("../utils/errorHandler");

const TIMEOUT_MS = Number(process.env.SCCE_TIMEOUT_MS) || 10000;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

/**
 * Shared axios instance for talking to SCCE. We disable automatic redirect
 * following so we can control exactly which cookie/headers go with each
 * hop — SCCE's flows depend on a session cookie surviving a POST -> GET (or
 * POST -> 302 -> GET) sequence.
 *
 * Accept-Encoding is pinned to gzip/deflate (no br/zstd): SCCE sits behind
 * Cloudflare, which has been observed serving zstd-encoded responses, and
 * not every Node runtime has zstd decompression built in. Sticking to
 * gzip/deflate keeps this reliable across environments.
 */
const scceClient = axios.create({
  timeout: TIMEOUT_MS,
  headers: {
    "User-Agent": BROWSER_USER_AGENT,
    "Accept-Encoding": "gzip, deflate",
  },
  maxRedirects: 0,
  validateStatus: () => true, // we inspect status codes ourselves
});

/**
 * Heuristic guard: if the returned HTML mentions CAPTCHA/OTP/login, we must
 * not try to work around it — surface a clear error instead.
 * @param {string} html
 */
function assertNoAccessControl(html) {
  const lowered = String(html).toLowerCase();
  const blockers = [
    "captcha",
    "verify you are human",
    "one time password",
    "otp",
    "please login",
    "session expired",
  ];
  const hit = blockers.find((term) => lowered.includes(term));
  if (hit) {
    throw new PortalError(
      "The SCCE portal is requesting additional verification (e.g. CAPTCHA/OTP/login) that this tool cannot and will not bypass. Please check the result directly on the official SCCE website.",
      502,
      "ACCESS_CONTROL_REQUIRED"
    );
  }
}

/**
 * Extracts the PHPSESSID cookie pair (e.g. "PHPSESSID=abc123") from a
 * response's Set-Cookie header(s), if present.
 * @param {import('axios').AxiosResponse} response
 * @returns {string|null}
 */
function extractSessionCookie(response) {
  const setCookie = response.headers["set-cookie"];
  if (!setCookie) return null;

  const sessionEntry = setCookie.find((entry) => entry.startsWith("PHPSESSID="));
  if (!sessionEntry) return null;

  return sessionEntry.split(";")[0]; // "PHPSESSID=abc123"
}

/**
 * Shared login handshake for every page under /parentm/ (overall
 * attendance, daily report, etc). Every one of those pages depends on a
 * session that's tied to the hall ticket you just logged in with, so this
 * is re-run per request rather than cached — our backend has no browser
 * session of its own to reuse across calls.
 *   1. GET  index.php -> obtain a fresh PHPSESSID cookie
 *   2. POST index.php -> submit HallticketNo, using that cookie
 *
 * @param {string} hallTicket
 * @returns {Promise<string>} the session cookie to reuse on subsequent requests
 */
async function establishAttendanceSession(hallTicket) {
  const loginPage = await scceClient.get(PORTAL.attendance.login);

  if (loginPage.status < 200 || loginPage.status >= 400) {
    throw new PortalError(
      `Could not load the SCCE attendance login page (status ${loginPage.status}).`,
      502,
      "SCCE_BAD_STATUS"
    );
  }

  const sessionCookie = extractSessionCookie(loginPage);
  if (!sessionCookie) {
    throw new PortalError(
      "SCCE did not issue a session cookie — the portal may have changed.",
      502,
      "NO_SESSION_COOKIE"
    );
  }

  const loginSubmit = await scceClient.post(
    PORTAL.attendance.login,
    new URLSearchParams({ HallticketNo: hallTicket, submit: "Login" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
        Origin: "https://scce.ac.in",
        Referer: PORTAL.attendance.login,
      },
    }
  );

  if (loginSubmit.status >= 400 && loginSubmit.status !== 302) {
    throw new PortalError(
      `SCCE rejected the hall ticket submission (status ${loginSubmit.status}).`,
      502,
      "SCCE_BAD_STATUS"
    );
  }

  return sessionCookie;
}

/**
 * Fetch the overall attendance report HTML for a given hall ticket.
 *   1. establishAttendanceSession(hallTicket)
 *   2. GET updateddata.php -> fetch the rendered report, same cookie
 *
 * @param {string} hallTicket
 * @returns {Promise<string>} raw HTML of the attendance report page
 */
async function fetchAttendanceHtml(hallTicket) {
  const sessionCookie = await establishAttendanceSession(hallTicket);

  const dataPage = await scceClient.get(PORTAL.attendance.data, {
    headers: {
      Cookie: sessionCookie,
      Referer: PORTAL.attendance.login,
    },
  });

  // SCCE's own server has been observed returning HTTP 500 on this endpoint
  // while still emitting a fully-rendered HTML page (likely a PHP
  // warning/notice on their end, not a real failure) — so we don't hard-fail
  // on status here, only when the body is empty or unusable.
  if (!dataPage.data) {
    throw new PortalError(
      `SCCE returned no data (status ${dataPage.status}).`,
      502,
      "SCCE_EMPTY_RESPONSE"
    );
  }

  assertNoAccessControl(dataPage.data);
  return dataPage.data;
}

/**
 * Fetch the Dailywisereport.php form page HTML for a given hall ticket —
 * this contains the <select> of dates the student has attendance data for.
 *
 * @param {string} hallTicket
 * @returns {Promise<string>} raw HTML containing the date dropdown
 */
async function fetchDailyAttendanceDatesHtml(hallTicket) {
  const sessionCookie = await establishAttendanceSession(hallTicket);

  const page = await scceClient.get(PORTAL.attendance.daily, {
    headers: {
      Cookie: sessionCookie,
      Referer: PORTAL.attendance.data,
    },
  });

  if (!page.data) {
    throw new PortalError(
      `SCCE returned no data (status ${page.status}).`,
      502,
      "SCCE_EMPTY_RESPONSE"
    );
  }

  assertNoAccessControl(page.data);
  return page.data;
}

/**
 * Fetch the period-wise attendance report HTML for one specific date.
 *   1. establishAttendanceSession(hallTicket)
 *   2. POST Dailywisereport.php -> body: date=<YYYY-MM-DD>&dayatten=Submit
 *
 * @param {string} hallTicket
 * @param {string} date in YYYY-MM-DD format, matching a real <option value>
 * @returns {Promise<string>} raw HTML of that day's report
 */
async function fetchDailyAttendanceReportHtml(hallTicket, date) {
  const sessionCookie = await establishAttendanceSession(hallTicket);

  const page = await scceClient.post(
    PORTAL.attendance.daily,
    new URLSearchParams({ date, dayatten: "Submit" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
        Origin: "https://scce.ac.in",
        Referer: PORTAL.attendance.daily,
      },
    }
  );

  if (page.status < 200 || page.status >= 400) {
    throw new PortalError(
      `SCCE daily attendance portal returned status ${page.status}.`,
      502,
      "SCCE_BAD_STATUS"
    );
  }

  if (!page.data) {
    throw new PortalError(
      "SCCE returned no data for that date.",
      502,
      "SCCE_EMPTY_RESPONSE"
    );
  }

  assertNoAccessControl(page.data);
  return page.data;
}

/**
 * Fetch the result report HTML for a given hall ticket, replicating the
 * real 2-step browser flow observed via DevTools. Unlike attendance, both
 * steps hit the SAME url — the second (POST) response already contains
 * the full rendered result page, no further redirect/hop needed.
 *   1. GET  /result/index.php -> obtain a fresh PHPSESSID cookie
 *   2. POST /result/index.php -> submit htno + resultstu=Results,
 *                                 same cookie -> full result HTML back
 *
 * @param {string} hallTicket
 * @returns {Promise<string>} raw HTML of the result report page
 */
async function fetchResultHtml(hallTicket) {
  const formPage = await scceClient.get(PORTAL.result.page);

  if (formPage.status < 200 || formPage.status >= 400) {
    throw new PortalError(
      `Could not load the SCCE result page (status ${formPage.status}).`,
      502,
      "SCCE_BAD_STATUS"
    );
  }

  let sessionCookie = extractSessionCookie(formPage);

  const postHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    Origin: "https://scce.ac.in",
    Referer: PORTAL.result.referer,
  };
  if (sessionCookie) postHeaders.Cookie = sessionCookie;

  const resultPage = await scceClient.post(
    PORTAL.result.page,
    new URLSearchParams({ htno: hallTicket, resultstu: "Results" }).toString(),
    { headers: postHeaders }
  );

  if (resultPage.status < 200 || resultPage.status >= 400) {
    throw new PortalError(
      `SCCE result portal returned status ${resultPage.status}.`,
      502,
      "SCCE_BAD_STATUS"
    );
  }

  if (!resultPage.data) {
    throw new PortalError(
      "SCCE returned no data for that hall ticket.",
      502,
      "SCCE_EMPTY_RESPONSE"
    );
  }

  assertNoAccessControl(resultPage.data);
  return resultPage.data;
}

module.exports = {
  fetchAttendanceHtml,
  fetchDailyAttendanceDatesHtml,
  fetchDailyAttendanceReportHtml,
  fetchResultHtml,
};
