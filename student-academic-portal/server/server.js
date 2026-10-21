require("dotenv").config();

const express = require("express");
const cors = require("cors");

const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const { errorMiddleware } = require("./utils/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/attendance", attendanceRoutes);
app.use("/api/result", resultRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
  });
});

// Centralized error handler (must be registered last)
app.use(errorMiddleware);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Student Academic Portal API running on http://localhost:${PORT}`);
});
