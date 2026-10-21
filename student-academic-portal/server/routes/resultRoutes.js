const express = require("express");
const { getResult } = require("../controllers/resultController");

const router = express.Router();

// POST /api/result
router.post("/", getResult);

module.exports = router;
