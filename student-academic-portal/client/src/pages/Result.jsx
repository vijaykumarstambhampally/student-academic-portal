import { useState } from "react";
import HallTicketForm from "../components/HallTicketForm.jsx";
import Loading from "../components/Loading.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import ResultCard from "../components/ResultCard.jsx";
import ResultTable from "../components/ResultTable.jsx";
import BacklogTable from "../components/BacklogTable.jsx";
import { getResult } from "../services/api.js";
import "../styles/result.css";

function Result() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const handleSubmit = async (hallTicket) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const result = await getResult(hallTicket);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="result-page">
      <h2>Result</h2>
      <HallTicketForm
        onSubmit={handleSubmit}
        loading={loading}
        actionLabel="View Result"
      />

      {loading && <Loading label="Fetching result..." />}
      <ErrorMessage message={error} />

      {data && (
        <div className="result-results">
          <ResultCard
            student={data.student}
            cgpa={data.cgpa}
            percentage={data.percentage}
            backlogs={data.backlogs}
          />
          <ResultTable semesters={data.semesters} />
          <BacklogTable backlogSubjects={data.backlogSubjects} />
        </div>
      )}
    </div>
  );
}

export default Result;
