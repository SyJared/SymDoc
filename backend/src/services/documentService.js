const { pool } = require("../db.js");
const { chunkText } = require("./chunking");
const { embedTexts } = require("./embeddings");

/**
 * Takes a raw document (title + text), chunks it, embeds every chunk,
 * and stores everything in Postgres inside a single transaction.
 *
 * Deliberately framework-agnostic: no req/res here. That means you could
 * call this from a CLI script, a test, a queue worker, whatever — not
 * just an Express route. That's the whole point of a service layer.
 */
async function createDocumentFromText(title, text) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "INSERT INTO documents (title) VALUES ($1) RETURNING id",
      [title]
    );
    const documentId = rows[0].id;

    const chunks = chunkText(text);
    const embeddings = await embedTexts(chunks, "document");

    for (let i = 0; i < chunks.length; i++) {
      const vectorLiteral = `[${embeddings[i].join(",")}]`;
      await client.query(
        `INSERT INTO chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4)`,
        [documentId, i, chunks[i], vectorLiteral]
      );
    }

    await client.query("COMMIT");
    return { documentId, chunkCount: chunks.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err; // let the controller decide how to turn this into an HTTP response
  } finally {
    client.release();
  }
}

async function listDocumentsWithChunkCounts() {
  const { rows } = await pool.query(
    `SELECT documents.id, documents.title, documents.created_at,
            COUNT(chunks.id) AS chunk_count
     FROM documents
     LEFT JOIN chunks ON chunks.document_id = documents.id
     GROUP BY documents.id
     ORDER BY documents.created_at DESC`
  );
  return rows;
}

module.exports = {
  createDocumentFromText,
  listDocumentsWithChunkCounts,
};