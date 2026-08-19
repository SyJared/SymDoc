const { embedOne } = require("./embeddings");
const { findSimilarChunks } = require("./retrieval");
const { answerFromContext } = require("./llm");
const { checkGrounding } = require("./groundingCheck");

/**
 * The full RAG pipeline for one question, top to bottom:
 * embed question -> vector search -> ask LLM -> verify citations.
 * Like documentService.js, this has zero knowledge of HTTP -- it just
 * takes a question string in, returns a plain result object out.
 */
async function answerQuestion(question, k = 5) {
  const queryEmbedding = await embedOne(question, "query");
  const chunks = await findSimilarChunks(queryEmbedding, k);

  if (chunks.length === 0) {
    return {
      answer: "No documents have been uploaded yet.",
      confidence: "low",
      sources: [],
      grounded: false,
    };
  }

  const llmResult = await answerFromContext(question, chunks);
  const finalResult = checkGrounding(llmResult, chunks);

  return {
    ...finalResult,
    retrievedChunks: chunks.map((c) => ({
      document_title: c.document_title,
      similarity: Number(c.similarity.toFixed(3)),
    })),
  };
}

module.exports = { answerQuestion };