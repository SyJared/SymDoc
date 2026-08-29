const { pool } = require("../db");
const { chunkText } = require("./chunking");
const { embedTexts } = require("./embeddings");
const { extractTextFromPdf } = require("./pdfExtract");

async function createDocumentFromSource(title, { text, pdfBuffer }) {
  const resolvedText = pdfBuffer ? await extractTextFromPdf(pdfBuffer) : text;

  if (!resolvedText || !resolvedText.trim()) {
    throw new Error("No extractable text found in the provided document");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "INSERT INTO documents (title) VALUES ($1) RETURNING id",
      [title]
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

async function deleteDocument(id) {
  const { rowCount } = await pool.query(
    "DELETE FROM documents WHERE id = $1",
    [id]
  );
  return rowCount > 0;
}

module.exports = { createDocumentFromSource, listDocumentsWithChunkCounts, deleteDocument };