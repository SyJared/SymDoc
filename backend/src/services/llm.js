const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Builds the RAG prompt, now with conversation history.
 *
 * Important distinction: history is used ONLY to understand what the
 * question means (e.g. resolving "what about the second one?" using the
 * prior turn) -- it is NOT an additional source of facts. Every factual
 * claim in the answer must still come from the retrieved context chunks,
 * same as before. This keeps grounding/hallucination mitigation intact
 * even with memory added.
 */
function buildPrompt(question, chunks, history = []) {
  const context = chunks
    .map(
      (c, i) =>
        `[Chunk ${i + 1}] (source: "${c.document_title}")\n${c.content}`
    )
    .join("\n\n");

  const historyBlock =
    history.length > 0
      ? `Conversation so far (for understanding context/follow-ups only --
NOT a source of facts):
${history.map((h) => `User: ${h.question}\nAssistant: ${h.answer}`).join("\n\n")}

`
      : "";

  return `You are answering a question using ONLY the context chunks below.

${historyBlock}Context:
${context}

Current question: ${question}

Rules:
- Only use information found in the context above. Do not use outside knowledge.
- Use the conversation history only to understand what the current question
  is referring to (e.g. pronouns, "the second one", follow-ups). Never treat
  the history itself as a source of facts -- facts must come from Context.
- If the context does not contain enough information to answer, set "answer" to
  a short explanation that the documents don't cover this, and set "confidence" to "low".
- Every item in "sources" must include a "quote" that is copied VERBATIM
  (word-for-word) from the chunk it references. Do not paraphrase the quote.
- "confidence" must be one of: "high", "medium", "low".`;
}

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

async function answerFromContext(question, chunks, history = []) {
  const prompt = buildPrompt(question, chunks, history);

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