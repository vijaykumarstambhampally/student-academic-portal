/**
 * @param {{ backlogSubjects: Array<{code:string,name:string,grade:string,gradePoint:number,year:string,sem:string,date:string}> }} props
 */
function BacklogTable({ backlogSubjects }) {
  if (!backlogSubjects || backlogSubjects.length === 0) return null;

  return (
    <div className="result-semester-block">
      <h4>Backlog Subjects</h4>
      <table className="result-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Subject</th>
            <th>Grade</th>
            <th>Year</th>
            <th>Sem</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {backlogSubjects.map((subj) => (
            <tr key={subj.code}>
              <td>{subj.code}</td>
              <td>{subj.name}</td>
              <td className="cell-fail">{subj.grade}</td>
              <td>{subj.year}</td>
              <td>{subj.sem}</td>
              <td>{subj.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BacklogTable;