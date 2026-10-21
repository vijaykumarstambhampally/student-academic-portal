import { useState } from "react";
import HallTicketForm from "../components/HallTicketForm.jsx";
import Loading from "../components/Loading.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import AttendanceCard from "../components/AttendanceCard.jsx";
import AttendanceTable from "../components/AttendanceTable.jsx";
import StudentInfoCard from "../components/StudentInfoCard.jsx";
import DailyAttendanceTable from "../components/DailyAttendanceTable.jsx";
import { getAttendance, getAttendanceDates, getDailyAttendance } from "../services/api.js";
import "../styles/attendance.css";

function Attendance() {
  const [hallTicket, setHallTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  // Daily attendance (nested inside this same page)
  const [showDaily, setShowDaily] = useState(false);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dailyReport, setDailyReport] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyError, setDailyError] = useState("");

  const handleSubmit = async (ht) => {
    setLoading(true);
    setError("");
    setData(null);
    setShowDaily(false);
    setDates([]);
    setSelectedDate("");
    setDailyReport(null);
    setDailyError("");
    try {
      const result = await getAttendance(ht);
      setHallTicket(ht);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDaily = async () => {
    setShowDaily(true);
    if (dates.length > 0) return; // already loaded, just reveal the picker
    setLoadingDates(true);
    setDailyError("");
    try {
      const result = await getAttendanceDates(hallTicket);
      setDates(result.dates);
    } catch (err) {
      setDailyError(err.message);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleViewDay = async () => {
    if (!selectedDate) return;
    setLoadingDaily(true);
    setDailyError("");
    setDailyReport(null);
    try {
      const result = await getDailyAttendance(hallTicket, selectedDate);
      setDailyReport(result);
    } catch (err) {
      setDailyError(err.message);
    } finally {
      setLoadingDaily(false);
    }
  };

  return (
    <div className="attendance-page">
      <h2>Attendance</h2>
      <HallTicketForm
        onSubmit={handleSubmit}
        loading={loading}
        actionLabel="View Attendance"
      />

      {loading && <Loading label="Fetching attendance..." />}
      <ErrorMessage message={error} />

      {data && (
        <div className="attendance-results">
          <StudentInfoCard student={data.student} />
          <AttendanceCard overallPercentage={data.overallPercentage} />
          <AttendanceTable subjects={data.subjects} />

          {!showDaily && (
            <button className="daily-attendance-toggle" onClick={handleShowDaily}>
              View Daily Attendance
            </button>
          )}

          {showDaily && (
            <div className="hall-ticket-form">
              <label htmlFor="dateSelect">Select a Date</label>

              {loadingDates && <Loading label="Fetching available dates..." />}
              <ErrorMessage message={dailyError} />

              {dates.length > 0 && (
                <>
                  <select
                    id="dateSelect"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="">Choose a date</option>
                    {dates.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleViewDay} disabled={!selectedDate || loadingDaily}>
                    {loadingDaily ? "Loading..." : "View Day"}
                  </button>
                </>
              )}
            </div>
          )}

          {loadingDaily && <Loading label="Fetching daily report..." />}
          <DailyAttendanceTable report={dailyReport} />
        </div>
      )}
    </div>
  );
}

export default Attendance;
