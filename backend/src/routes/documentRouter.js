const express = require("express");
const multer = require("multer");
const { uploadDocument, getDocuments, removeDocument } = require("../controllers/documentsController");
const { uploadLimiter } = require("../middleware/rateLimiter");
const { requireAnonId } = require("../middleware/requireAnonId");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// requireAnonId runs on every route below, attaching req.ownerId
router.use(requireAnonId);

router.post("/", uploadLimiter, upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.delete("/:id", removeDocument);

module.exports = router;