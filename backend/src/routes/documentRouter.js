const express = require("express");
const multer = require("multer");
const { uploadDocument, getDocuments } = require("../controllers/documentController");

const router = express.Router();

// memoryStorage() keeps the uploaded file as a Buffer in RAM instead of
// writing it to disk -- fine for our case since we only need the bytes
// briefly to extract text, then we're done with the file entirely.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap, reject anything bigger
});

// upload.single("file") runs BEFORE uploadDocument, parses the incoming
// multipart request, and attaches the uploaded file to req.file.
router.post("/", upload.single("file"), uploadDocument);

router.get("/", getDocuments);

module.exports = router;