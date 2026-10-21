import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Student Academic Portal
      </Link>
      <nav className="navbar-links">
        <Link to="/attendance">Attendance</Link>
        <Link to="/result">Result</Link>
      </nav>
    </header>
  );
}

export default Navbar;
