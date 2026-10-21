const STATUS_LABEL = {
  PRESENT: "Present",
  ABSENT: "Absent",
  PARTIAL: "Partial",
  UNKNOWN: "—",
};

const STATUS_CLASS = {
  PRESENT: "cell-pass",
  ABSENT: "cell-fail",
  PARTIAL: "cell-low",
  UNKNOWN: "",
};

/**
 * @param {{ report: { date:string|null, totalAttended:number|null, totalConducted:number|null, periods: Array<{hour:number|string,subject:string,attended:number,conducted:number,status:string}> } }} props
 */
function DailyAttendanceTable({ report }) {
  if (!report) return null;

  return (
    <div className="attendance-results">
      <div className="attendance-card">
        <h3>{report.date ? `Date: ${report.date}` : "Daily Report"}</h3>
        {report.totalAttended !== null && report.totalConducted !== null && (
          <p>
            Attended {report.totalAttended} out of {report.totalConducted} period
            {report.totalConducted === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Hour</th>
            <th>Subject</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {report.periods.map((p, idx) => (
            <tr key={idx}>
              <td>{p.hour}</td>
              <td>{p.subject}</td>
              <td className={STATUS_CLASS[p.status] || ""}>
                {STATUS_LABEL[p.status] || p.status}
                {p.conducted > 1 && ` (${p.attended}/${p.conducted})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DailyAttendanceTable;