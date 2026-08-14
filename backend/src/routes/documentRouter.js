const express = require("express");
const { uploadDocument, getDocuments } = require("../controllers/documentController");

const router = express.Router();

// POST /api/documents  { title, text }
router.post("/", uploadDocument);

// GET /api/documents
router.get("/", getDocuments);

module.exports = router;