/**
 * @param {{ subjects: Array<{subject:string,totalClasses:number,attendedClasses:number,percentage:number}> }} props
 */
function AttendanceTable({ subjects }) {
  if (!subjects || subjects.length === 0) return null;

  return (
    <table className="attendance-table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Total Classes</th>
          <th>Attended</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        {subjects.map((s) => (
          <tr key={s.subject}>
            <td>{s.subject}</td>
            <td>{s.totalClasses}</td>
            <td>{s.attendedClasses}</td>
            <td className={s.percentage < 75 ? "cell-low" : ""}>
              {s.percentage.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AttendanceTable;
