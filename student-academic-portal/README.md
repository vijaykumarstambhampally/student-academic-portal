# Student Academic Portal (SCCE)

A **read-only** portal that lets an SCCE student enter their Hall Ticket Number
and view:

- 📊 **Attendance** (overall + subject-wise)
- 📄 **Result** (CGPA, semester-wise subjects, pass/fail status)

The site never modifies attendance or result data — it only fetches and
displays what the official SCCE portal already returns for that hall ticket.

## Architecture

```
React (client) --POST /api/attendance or /api/result--> Express (server)
                                                              │
                                                              ▼
                                              SCCE Portal (parentm / extres2.php)
                                                              │
                                                              ▼
                                                     Cheerio HTML parser
                                                              │
                                                              ▼
                                                        JSON response
                                                              │
                                                              ▼
                                                     React dashboard
```

The React frontend **never** talks to `scce.ac.in` directly — every request
goes through the Express backend, which is the only place the SCCE URLs are
configured (see `server/config/portal.js`).

## ⚠️ Before this works for real

The scraping logic in `server/services/collegePortal.js` and the two parser
files are **scaffolded with placeholders**, because the exact request format
SCCE expects (HTTP method, form field name for the hall ticket, whether it
needs a session/cookie, hidden tokens, etc.) is not something that can be
safely guessed. To finish the integration:

1. Open the SCCE attendance/result page in a browser with DevTools → Network
   tab open.
2. Submit a real hall ticket number and inspect the actual request
   (method, URL, form field names, headers, cookies).
3. Fill in `collegePortal.js` with that exact request.
4. Inspect the returned HTML structure and update the Cheerio selectors in
   `attendanceParser.js` / `resultParser.js` to match the real table/element
   structure.

**Do not** attempt to bypass any CAPTCHA, OTP, or login step that SCCE
presents — if the portal requires one, this project cannot proceed
automatically and should surface a clear error to the user instead.

## Setup

```bash
npm run install:all   # installs both client and server dependencies
npm run dev            # runs client (Vite) and server (Express) together
```

- Client dev server: http://localhost:5173
- API server: http://localhost:5000

Configure the API port / SCCE base URLs via `server/.env` (see
`server/.env.example`).

## Tech stack

| Layer          | Technology        |
|----------------|--------------------|
| Frontend       | React.js (Vite)    |
| Backend        | Node.js + Express  |
| HTML Parsing   | Cheerio            |
| HTTP Requests  | Axios              |
| Database       | None (fetch → display → discard) |
