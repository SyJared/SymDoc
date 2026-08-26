const express = require("express");
const multer = require("multer");
const { uploadDocument, getDocuments, removeDocument } = require("../controllers/documentController");
const { uploadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", uploadLimiter, upload.single("file"), uploadDocument);

router.get("/", getDocuments);

router.delete("/:id", removeDocument);

module.exports = router;