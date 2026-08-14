const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Embeds an array of text strings.
 * inputType is "document" when embedding chunks for storage,
 * and "query" when embedding the user's question.
 */
async function embedTexts(texts, inputType = "document") {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-4-lite",
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Voyage embedding request failed: ${res.status} ${errBody}`);
  }

  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

async function embedOne(text, inputType = "document") {
  const [embedding] = await embedTexts([text], inputType);
  return embedding;
}

module.exports = { embedTexts, embedOne };