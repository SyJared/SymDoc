const {createDocumentFromText, listDocumentsWithChunkCounts} = require("../services/documentService");
/**
 * Controllers only do three things:
 * 1. Pull data out of the HTTP request (validate what's required)
 * 2. Call a service function to do the actual work
 * 3. Shape the result into an HTTP response (status code + JSON)
 *
 * They never talk to the database directly, and never import pg. If you
 * ever swap Express for Fastify, or add a CLI, this file is the only
 * thing that would need to change — the service layer stays untouched.
 */
async function uploadDocument(req, res) {
  const { title, text } = req.body;

  if (!title || !text) {
    return res.status(400).json({ error: "title and text are required" });
  }

  try {
    const result = await createDocumentFromText(title, text);
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