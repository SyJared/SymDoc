const express = require("express");
const { askQuestion } = require("../controllers/queryController");
const { queryLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", queryLimiter, askQuestion);

module.exports = router;