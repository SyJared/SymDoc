const {
  createDocumentFromSource,
  listDocumentsWithChunkCounts,
} = require("../services/documentService");

/**
 * Handles BOTH cases: a PDF file upload (req.file, from multer) and a
 * pasted-text upload (req.body.text, from the original JSON-style form).
 * Whichever one is present gets passed to the service -- the controller's
 * only job is figuring out which one this request actually is.
 */
async function uploadDocument(req, res) {
  const { title, text } = req.body;
  const pdfBuffer = req.file ? req.file.buffer : null;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!text && !pdfBuffer) {
    return res.status(400).json({ error: "either text or a PDF file is required" });
  }

  try {
    const result = await createDocumentFromSource(title, { text, pdfBuffer });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store document" });
  }
}

async function getDocuments(_req, res) {
  try {
    const documents = await listDocumentsWithChunkCounts();
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list documents" });
  }
}

module.exports = { uploadDocument, getDocuments };