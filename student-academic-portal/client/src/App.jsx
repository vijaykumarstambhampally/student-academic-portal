import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Attendance from "./pages/Attendance.jsx";
import Result from "./pages/Result.jsx";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
