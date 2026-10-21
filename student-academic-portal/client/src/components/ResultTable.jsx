/**
 * @param {{ semesters: Array<{semester:string, subjects: Array<{code:string,name:string,grade:string,marks:number,maxMarks:number,status:string}>}> }} props
 */
function ResultTable({ semesters }) {
  if (!semesters || semesters.length === 0) return null;

  return (
    <div className="result-table-wrapper">
      {semesters.map((sem) => (
        <div key={sem.semester} className="result-semester-block">
          <h4>{sem.semester}</h4>
          <table className="result-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Marks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sem.subjects.map((subj) => (
                <tr key={subj.code}>
                  <td>{subj.code}</td>
                  <td>{subj.name}</td>
                  <td>{subj.grade}</td>
                  <td>
                    {subj.marks}/{subj.maxMarks}
                  </td>
                  <td className={subj.status === "PASS" ? "cell-pass" : "cell-fail"}>
                    {subj.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default ResultTable;
