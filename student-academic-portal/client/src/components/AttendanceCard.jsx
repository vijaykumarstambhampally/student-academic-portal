/**
 * @param {{ overallPercentage: number }} props
 */
function AttendanceCard({ overallPercentage }) {
  const pct = Math.min(100, Math.max(0, overallPercentage));
  const isLow = pct < 75;

  return (
    <div className="attendance-card">
      <h3>Overall Attendance</h3>
      <p className="attendance-percentage">{pct.toFixed(2)}%</p>
      <div className="progress-track">
        <div
          className={`progress-fill ${isLow ? "progress-fill--low" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="attendance-warning">
          Attendance is below 75%. Check the SCCE portal for eligibility
          requirements.
        </p>
      )}
    </div>
  );
}

export default AttendanceCard;
