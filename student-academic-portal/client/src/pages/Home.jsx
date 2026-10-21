import { useNavigate } from "react-router-dom";
import "../styles/home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <h1>Know where you stand.</h1>
          <p className="hero-subtitle">
            Pull your real attendance and results straight from the SCCE
            portal — no queueing at the office, no digging through the old
            site's menus.
          </p>
          <div className="hero-actions">
            <button className="hero-btn hero-btn-primary" onClick={() => navigate("/attendance")}>
              View Attendance
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => navigate("/result")}>
              View Result
            </button>
          </div>
          <p className="hero-note">
            Just your Hall Ticket Number — nothing else to enter.
          </p>
        </div>
        <div className="hero-visual">
          <img src="/assets/logo.jpg" alt="College logo" className="college-logo" />
          <p className="college-tagline">CSE DEPARTMENT</p>
          <p className="college-tagline-sub">Student Academic Portal</p>
        </div>
      </section>

      <section className="feature-row">
        <div className="feature">
          <h3>Attendance percentage</h3>
          <p>
            Overall and subject-wise numbers, pulled live, with the 75%
            cut-off flagged automatically.
          </p>
        </div>
        <div className="feature">
          <h3>Daily-wise log</h3>
          <p>
            Pick any date and see exactly which periods you were marked
            present or absent for.
          </p>
        </div>
        <div className="feature">
          <h3>Result &amp; CGPA</h3>
          <p>
            Semester-by-semester marks, your CGPA, and any outstanding
            backlogs, in one place.
          </p>
        </div>
      </section>

      <p className="home-disclaimer">
        This portal is read-only — it cannot change your attendance or
        result records.
      </p>
    </div>
  );
}

export default Home;