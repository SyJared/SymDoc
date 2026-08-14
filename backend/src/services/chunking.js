/**
 * Splits text into overlapping word-based chunks.
 *
 * Why overlap? If a sentence gets cut in half at a chunk boundary, both
 * halves lose meaning on their own. A small overlap (e.g. 50 words) means
 * important context near a boundary shows up in two chunks instead of none.
 */
function chunkText(text, { chunkSize = 400, overlap = 50 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");
    chunks.push(chunk);

    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}

module.exports = { chunkText };