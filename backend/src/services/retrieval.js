const { pool } = require("../db");

/**
 * Finds the top-k chunks most similar to the query embedding.
 * If documentId is provided, search is restricted to that one document's
 * chunks only -- otherwise it searches across every document.
 */
async function findSimilarChunks(queryEmbedding, k = 5, documentId = null) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const whereClause = documentId ? "WHERE chunks.document_id = $3" : "";
  const params = documentId
    ? [vectorLiteral, k, documentId]
    : [vectorLiteral, k];

  const { rows } = await pool.query(
    `SELECT
       chunks.id,
       chunks.content,
       chunks.chunk_index,
       documents.id AS document_id,
       documents.title AS document_title,
       1 - (chunks.embedding <=> $1) AS similarity
     FROM chunks
     JOIN documents ON documents.id = chunks.document_id
     ${whereClause}
     ORDER BY chunks.embedding <=> $1
     LIMIT $2`,
    params
  );

  return rows;
}

module.exports = { findSimilarChunks };