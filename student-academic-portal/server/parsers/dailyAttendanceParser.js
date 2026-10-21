const cheerio = require("cheerio");
const { PortalError } = require("../utils/errorHandler");

/**
 * Parses the list of selectable dates out of Dailywisereport.php's own
 * <select name="date"> dropdown, e.g.:
 *   [{ value: "2026-09-10", label: "10-09-2026" }, ...]
 *
 * @param {string} html
 */
function parseAvailableDates(html) {
  const $ = cheerio.load(html);
  const dates = [];

  $("select[name='date'] option").each((_, opt) => {
    const value = $(opt).attr("value");
    const label = $(opt).text().trim();
    if (!value) return; // skip the blank "Date" placeholder option
    dates.push({ value, label });
  });

  if (dates.length === 0) {
    throw new PortalError(
      "Could not find any available dates in the SCCE response. The portal may have changed, or the Hall Ticket Number may not exist.",
      502,
      "PARSE_EMPTY"
    );
  }

  return dates;
}

/**
 * Parses one day's period-wise attendance report into:
 * {
 *   date: "09-09-2026",
 *   totalAttended: 4,
 *   totalConducted: 5,
 *   periods: [
 *     { hour: 1, subject: "DEVOPS", attended: 1, conducted: 1, status: "PRESENT" },
 *     { hour: 2, subject: "DAA", attended: 0, conducted: 1, status: "ABSENT" },
 *     { hour: 5, subject: "CNLAB", attended: 3, conducted: 3, status: "PRESENT" }
 *   ]
 * }
 *
 * Verified against real responses from Dailywisereport.php:
 *  - Real column layout: Sno | Hour | Sub | Atnd | Cnctd
 *  - For an ordinary single-period class, Atnd/Cnctd are "1"/"1" (present)
 *    or "0"/"1" (absent) — but a multi-period LAB block is reported as a
 *    SINGLE row covering the whole block, e.g. Atnd="3", Cnctd="3" for a
 *    3-hour lab attended in full. Treating Atnd as a plain 0/1 flag (as an
 *    earlier version of this parser did) misreads any lab as absent, since
 *    "3" never equals "1". The correct rule is to compare attended vs
 *    conducted counts rather than checking for a literal "1".
 *  - A trailing row (colspan 3 "Total" label + 2 more cells) gives the
 *    day's totals directly.
 *
 * @param {string} html
 */
function parseDailyReport(html) {
  const $ = cheerio.load(html);

  let dateLabel = null;
  $("strong").each((_, el) => {
    const match = $(el).text().trim().match(/date is\s*(.+)/i);
    if (match) dateLabel = match[1].trim();
  });

  const periods = [];
  let totalAttended = null;
  let totalConducted = null;

  $("table").each((_, table) => {
    const headerText = $(table).find("tr").first().text().toLowerCase();
    const looksLikeDailyTable = headerText.includes("hour") && headerText.includes("sub");
    if (!looksLikeDailyTable) return;

    $(table)
      .find("tr")
      .slice(1) // skip header row
      .each((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();

        // Totals row: "Total" label (colspan 3) + attended + conducted
        if (cells.length === 3 && /total/i.test(cells[0])) {
          totalAttended = Number(cells[1]) || 0;
          totalConducted = Number(cells[2]) || 0;
          return;
        }

        // Real period rows: Sno, Hour, Sub, Atnd, Cnctd
        if (cells.length !== 5) return;

        const [, hour, subject, attendedText, conductedText] = cells;
        const attended = Number(attendedText) || 0;
        const conducted = Number(conductedText) || 0;

        let status;
        if (conducted === 0) status = "UNKNOWN";
        else if (attended >= conducted) status = "PRESENT";
        else if (attended === 0) status = "ABSENT";
        else status = "PARTIAL"; // attended some but not all periods in a multi-hour block

        periods.push({
          hour: Number(hour) || hour,
          subject,
          attended,
          conducted,
          status,
        });
      });
  });

  if (periods.length === 0) {
    throw new PortalError(
      "Could not find daily attendance data in the SCCE response for that date.",
      502,
      "PARSE_EMPTY"
    );
  }

  return {
    date: dateLabel,
    totalAttended,
    totalConducted,
    periods,
  };
}

module.exports = { parseAvailableDates, parseDailyReport };