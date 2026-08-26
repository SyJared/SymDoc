const { pool } = require("../db");
const { chunkText } = require("./chunking");
const { embedTexts } = require("./embeddings");
const { extractTextFromPdf } = require("./pdfExtract");

/**
 * ownerId is an anonymous per-browser identifier (generated on the
 * frontend, sent as a header) -- NOT a real authenticated user. It's
 * just a claim ticket: whoever holds this string can only see and
 * modify documents tagged with it.
 */
async function createDocumentFromSource(title, { text, pdfBuffer }, ownerId) {
  const resolvedText = pdfBuffer ? await extractTextFromPdf(pdfBuffer) : text;

  if (!resolvedText || !resolvedText.trim()) {
    throw new Error("No extractable text found in the provided document");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "INSERT INTO documents (title, owner_id) VALUES ($1, $2) RETURNING id",
      [title, ownerId]
    );
    const documentId = rows[0].id;

    const chunks = chunkText(resolvedText);
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
    throw err;
  } finally {
    client.release();
  }
}

// Filtered by owner: two different browsers calling this get two
// completely different lists, even though it's the same query, same
// table, same server.
async function listDocumentsWithChunkCounts(ownerId) {
  const { rows } = await pool.query(
    `SELECT documents.id, documents.title, documents.created_at,
            COUNT(chunks.id) AS chunk_count
     FROM documents
     LEFT JOIN chunks ON chunks.document_id = documents.id
     WHERE documents.owner_id = $1
     GROUP BY documents.id
     ORDER BY documents.created_at DESC`,
    [ownerId]
  );
  return rows;
}

// The AND owner_id = $2 here is what stops one visitor from deleting
// another visitor's document even if they somehow guessed the id.
async function deleteDocument(id, ownerId) {
  const { rowCount } = await pool.query(
    "DELETE FROM documents WHERE id = $1 AND owner_id = $2",
    [id, ownerId]
  );
  return rowCount > 0;
}

module.exports = { createDocumentFromSource, listDocumentsWithChunkCounts, deleteDocument };