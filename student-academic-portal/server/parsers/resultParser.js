const cheerio = require("cheerio");
const { PortalError } = require("../utils/errorHandler");

/**
 * Parses SCCE's result HTML into a clean JSON shape. Verified against a
 * real response captured from https://scce.ac.in/result/index.php:
 *
 * {
 *   student: { name, hallTicket, fatherName },
 *   cgpa: 6.63,
 *   percentage: 61.29,
 *   totalCredits: 80,
 *   totalCreditPoints: 609,
 *   backlogs: 1,
 *   backlogSubjects: [
 *     { code: "184AF", name: "BUSINESS ECONOMICS & FINANCIAL ANALYSIS", grade: "F", gradePoint: 0, year: "2", sem: "2", date: "10-06-2026" }
 *   ],
 *   semesters: [
 *     {
 *       semester: "Year 1 - Semester 1",
 *       subjects: [
 *         { code: "181AP", name: "PROGRAMMING FOR PROBLEM SOLVING", marks: 60, maxMarks: 100, status: "PASS" }
 *       ]
 *     }
 *   ]
 * }
 *
 * Real quirks this accounts for:
 *  - The subjects table's markup uses <tr/> instead of </tr>, which HTML
 *    parsers treat as an empty self-closed row immediately followed by an
 *    unrelated new row — so each real data row shows up alongside a phantom
 *    empty <tr>. We filter these out by requiring exactly 15 <td> cells
 *    (the real column count); phantom rows have 0.
 *  - The subjects table has 15 columns: S.No, Subject Code, Subject Name,
 *    Subject Credits, Grade, Grade Point, Subject C * Student GP, Internal
 *    Marks, External Marks, Total Marks, Max Marks, Credits, Year, Sem, date.
 *  - CGPA/Percentage/credit totals are plain text inside <h1> tags, not a
 *    table, so they're matched by keyword + a trailing number.
 *  - There's a separate "BACKLOG SUBJECT" table — this is the authoritative
 *    current backlog list (unlike the main table's Grade column, which can
 *    still show a stale "F" for a subject the student already cleared via
 *    a supplementary exam). We parse this table directly for both the
 *    backlog count and the subject details, rather than counting "F"
 *    grades in the main table.
 *
 * @param {string} html
 * @param {string} hallTicketFallback used if the page's own hall ticket
 *   field can't be found for some reason
 */
function parseResult(html, hallTicketFallback) {
  const $ = cheerio.load(html);

  let name = null;
  let hallTicket = hallTicketFallback;
  let fatherName = null;

  $("table").each((_, table) => {
    const tableText = $(table).text();
    if (!tableText.includes("Name :") || !tableText.includes("Hall Ticket")) return;

    $(table)
      .find("tr")
      .each((__, row) => {
        const label = $(row).find("td").first().text().trim().toLowerCase();
        const value = $(row).find("td").eq(1).text().trim();
        if (label.startsWith("hall ticket")) hallTicket = value || hallTicket;
        else if (label.startsWith("name")) name = value;
        else if (label.startsWith("father name")) fatherName = value;
      });
  });

  const semesterMap = new Map();

  $("table").each((_, table) => {
    if ($(table).text().includes("BACKLOG")) return; // handled separately below

    const headerRow = $(table).find("tr").first();
    const isSubjectsTable =
      headerRow.find("th").length >= 10 && headerRow.text().includes("Subject");
    if (!isSubjectsTable) return;

    $(table)
      .find("tr")
      .each((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();

        if (cells.length !== 15) return; // skip header row + phantom rows

        const [
          , // S.No
          subjectCode,
          subjectName,
          , // Subject Credits (registered)
          grade,
          , // Grade Point
          , // Subject Credits * Student GP
          , // Internal Marks
          , // External Marks
          totalMarks,
          maxMarks,
          , // Credits (earned)
          year,
          sem,
          , // date
        ] = cells;

        const semesterLabel = `Year ${year} - Semester ${sem}`;
        if (!semesterMap.has(semesterLabel)) semesterMap.set(semesterLabel, []);

        semesterMap.get(semesterLabel).push({
          code: subjectCode,
          name: subjectName,
          grade: grade.trim(),
          marks: Number(totalMarks) || 0,
          maxMarks: Number(maxMarks) || 0,
          status: grade.trim().toUpperCase() === "F" ? "FAIL" : "PASS",
        });
      });
  });

  const semesters = Array.from(semesterMap.entries()).map(([semester, subjects]) => ({
    semester,
    subjects,
  }));

  if (semesters.length === 0) {
    throw new PortalError(
      "Could not find result data in the SCCE response. The page structure may have changed, or the Hall Ticket Number may not exist.",
      502,
      "PARSE_EMPTY"
    );
  }

  // ---- BACKLOG SUBJECT table (authoritative current backlog list) ----
  const backlogSubjects = [];

  $("table").each((_, table) => {
    if (!$(table).text().includes("BACKLOG SUBJECT")) return;

    $(table)
      .find("tr")
      .each((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, td) => $(td).text().trim())
          .get();

        // Real backlog rows have exactly 9 columns:
        // S.No, Subject Code, Subject Name, Grade, Grade Point,
        // Tot GradePoint, Year, Sem, R-Date
        if (cells.length !== 9) return;

        const [, code, subjectName, grade, gradePoint, , year, sem, date] = cells;

        backlogSubjects.push({
          code,
          name: subjectName,
          grade,
          gradePoint: Number(gradePoint) || 0,
          year,
          sem,
          date,
        });
      });
  });

  // ---- CGPA / Percentage / credit totals from <h1> tags ----
  let cgpa = null;
  let percentage = null;
  let totalCredits = null;
  let totalCreditPoints = null;

  $("h1").each((_, el) => {
    const text = $(el).text();
    const numberMatch = text.match(/[\d.]+/);
    if (!numberMatch) return;

    if (/cgpa/i.test(text)) cgpa = parseFloat(numberMatch[0]);
    else if (/percentage/i.test(text)) percentage = parseFloat(numberMatch[0]);
    else if (/total registered subject credits/i.test(text))
      totalCredits = parseFloat(numberMatch[0]);
    else if (/total credit points/i.test(text))
      totalCreditPoints = parseFloat(numberMatch[0]);
  });

  return {
    student: { name: name || "Unknown", hallTicket, fatherName },
    cgpa,
    percentage,
    totalCredits,
    totalCreditPoints,
    backlogs: backlogSubjects.length,
    backlogSubjects,
    semesters,
  };
}

module.exports = { parseResult };