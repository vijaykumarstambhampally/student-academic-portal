/**
 * @param {{ student: {name:string, hallTicket:string, fatherName?:string}, cgpa: number|null, percentage: number|null, backlogs: number }} props
 */
function ResultCard({ student, cgpa, percentage, backlogs }) {
  return (
    <div className="result-card">
      <h3>{student.name}</h3>
      <p className="result-hallticket">Hall Ticket: {student.hallTicket}</p>
      {student.fatherName && (
        <p className="result-hallticket">Father's Name: {student.fatherName}</p>
      )}
      <div className="result-stats">
        <div className="result-stat">
          <span className="result-stat-value">
            {cgpa !== null ? cgpa.toFixed(2) : "—"}
          </span>
          <span className="result-stat-label">CGPA</span>
        </div>
        <div className="result-stat">
          <span className="result-stat-value">
            {percentage !== null ? `${percentage.toFixed(2)}%` : "—"}
          </span>
          <span className="result-stat-label">Percentage</span>
        </div>
        <div className="result-stat">
          <span className={`result-stat-value ${backlogs > 0 ? "cell-low" : ""}`}>
            {backlogs}
          </span>
          <span className="result-stat-label">Backlogs</span>
        </div>
      </div>
    </div>
  );
}

export default ResultCard;