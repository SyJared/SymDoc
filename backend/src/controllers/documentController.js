const {
  createDocumentFromSource,
  listDocumentsWithChunkCounts,
  deleteDocument,
} = require("../services/documentService");

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

async function removeDocument(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid document id" });
  }

  try {
    const deleted = await deleteDocument(id);
    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete document" });
  }
}

module.exports = { uploadDocument, getDocuments, removeDocument };