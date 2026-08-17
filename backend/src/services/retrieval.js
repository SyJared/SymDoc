const { pool } = require("../db");

/**
 * Finds the top-k chunks most similar to the query embedding using
 * pgvector's cosine distance operator (<=>). Lower distance = more similar,
 * so we order ascending and convert to a 0-1 similarity score for display.
 */
async function findSimilarChunks(queryEmbedding, k = 5) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const { rows } = await pool.query(
    `SELECT
       chunks.id,
       chunks.content,
       chunks.chunk_index,
       documents.title AS document_title,
       1 - (chunks.embedding <=> $1) AS similarity
     FROM chunks
     JOIN documents ON documents.id = chunks.document_id
     ORDER BY chunks.embedding <=> $1
     LIMIT $2`,
    [vectorLiteral, k]
  );

  return rows;
}

module.exports = { findSimilarChunks };