/**
 * @param {{ student: { hallTicket: string|null, name: string|null, year: string|null } }} props
 */
function StudentInfoCard({ student }) {
  if (!student || (!student.name && !student.hallTicket && !student.year)) return null;

  return (
    <div className="student-info-card">
      {student.name && <h3>{student.name}</h3>}
      <div className="student-info-row">
        {student.hallTicket && <span>Hall Ticket: {student.hallTicket}</span>}
        {student.year && <span>{student.year}</span>}
      </div>
    </div>
  );
}

export default StudentInfoCard;