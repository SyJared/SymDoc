const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Builds the RAG prompt. This bounds the model to only the provided
 * context (hallucination mitigation starts here, not just in checking
 * after the fact). Note: with Gemini we don't need to also beg for JSON
 * in the prompt text -- responseSchema below enforces the shape directly.
 */
function buildPrompt(question, chunks) {
  const context = chunks
    .map(
      (c, i) =>
        `[Chunk ${i + 1}] (source: "${c.document_title}")\n${c.content}`
    )
    .join("\n\n");

  return `You are answering a question using ONLY the context chunks below.

Context:
${context}

Question: ${question}

Rules:
- Only use information found in the context above. Do not use outside knowledge.
- If the context does not contain enough information to answer, set "answer" to
  a short explanation that the documents don't cover this, and set "confidence" to "low".
- Every item in "sources" must include a "quote" that is copied VERBATIM
  (word-for-word) from the chunk it references. Do not paraphrase the quote.
- "confidence" must be one of: "high", "medium", "low".`;
}

// Gemini's native structured-output feature: instead of asking nicely in
// the prompt and hoping, you give it a schema and the API constrains
// generation to match this shape directly.
const responseSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chunk_index: { type: "integer" },
          quote: { type: "string" },
        },
        required: ["chunk_index", "quote"],
      },
    },
  },
  required: ["answer", "confidence", "sources"],
};

async function answerFromContext(question, chunks) {
  const prompt = buildPrompt(question, chunks);

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API request failed: ${res.status} ${errBody}`);
  }

  const data = await res.json();
  const rawText = data.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON output: ${rawText}`);
  }
}

module.exports = { answerFromContext };