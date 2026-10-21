const cheerio = require("cheerio");
const { PortalError } = require("../utils/errorHandler");

/**
 * Parses SCCE's attendance HTML into a clean JSON shape:
 * {
 *   student: { hallTicket: "24N01A05L1", name: "STAMBHAMPALLY VIJAY KUMAR", year: "3rd Year" },
 *   overallPercentage: 80,
 *   subjects: [
 *     { subject: "AECSLAB", totalClasses: 24, attendedClasses: 18, percentage: 75 }
 *   ]
 * }
 *
 * Verified against a real response from updateddata.php:
 *  - There are exactly two <table class="table"> elements: the first has
 *    the student's hall ticket, photo, name, and year (one value per row);
 *    the second is the subject-wise attendance table with a trailing
 *    "Total" row giving the overall percentage directly.
 *  - Real column layout: Sno | Sub | Atnd | Cndt | %
 *  - The student-info table's rows aren't labeled — we tell them apart
 *    by shape: hall ticket looks like an 8-12 char alphanumeric code, the
 *    year row matches "<number><st|nd|rd|th> Year", and the remaining row
 *    is the name.
 *
 * @param {string} html
 */
function parseAttendance(html) {
  const $ = cheerio.load(html);

  // ---- Student info (hall ticket, name, year) ----
  let hallTicket = null;
  let name = null;
  let year = null;

  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray();
    const hasYearRow = rows.some((row) => /\d+\s*(st|nd|rd|th)\s*year/i.test($(row).text()));
    if (!hasYearRow) return; // not the student-info table

    rows.forEach((row) => {
      const cellTexts = $(row)
        .find("td")
        .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean);

      if (cellTexts.length === 0) return;
      const text = cellTexts[0];

      if (/\d+\s*(st|nd|rd|th)\s*year/i.test(text)) {
        year = text;
      } else if (/^[A-Za-z0-9]{8,12}$/.test(text)) {
        hallTicket = text;
      } else if (!name) {
        name = text;
      }
    });
  });

  // ---- Subject-wise attendance table ----
  const subjects = [];
  let overallFromTotalRow = null;

  $("table").each((_, table) => {
    const headerRowText = $(table).find("tr").first().text().toLowerCase();
    const looksLikeAttendanceTable =
      headerRowText.includes("sub") && headerRowText.includes("atnd");
    if (!looksLikeAttendanceTable) return;

    $(table)
      .find("tr")
      .slice(1) // skip header row
      .each((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();

        // Expect: Sno, Sub, Atnd, Cndt, %
        if (cells.length < 5) return;

        const [, subject, attended, conducted, percentageText] = cells;
        const percentage = parseFloat(percentageText) || 0;

        if (subject.toLowerCase() === "total") {
          overallFromTotalRow = percentage;
          return;
        }

        subjects.push({
          subject,
          totalClasses: Number(conducted) || 0,
          attendedClasses: Number(attended) || 0,
          percentage,
        });
      });
  });

  if (subjects.length === 0) {
    throw new PortalError(
      "Could not find attendance data in the SCCE response. The page structure may have changed, or the Hall Ticket Number may not exist.",
      502,
      "PARSE_EMPTY"
    );
  }

  const overallPercentage =
    overallFromTotalRow !== null
      ? overallFromTotalRow
      : subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length;

  return {
    student: { hallTicket, name, year },
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    subjects,
  };
}

module.exports = { parseAttendance };