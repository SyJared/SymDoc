const { answerQuestion } = require("../services/queryService");

/**
 * Same pattern as documentsController.js: pull data out of req,
 * call the service to do the real work, shape the HTTP response.
 * No RAG logic lives here -- that's all in queryService.js.
 */
async function askQuestion(req, res) {
  const { question, k, documentId, history } = req.body;

  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    const result = await answerQuestion(question, k || 5, documentId || null, history || []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to answer question" });
  }
}

module.exports = { askQuestion };