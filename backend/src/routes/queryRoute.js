const express = require("express");
const { askQuestion } = require("../controllers/queryController");

const router = express.Router();

// POST /api/query  { question, k? }
router.post("/", askQuestion);

module.exports = router;