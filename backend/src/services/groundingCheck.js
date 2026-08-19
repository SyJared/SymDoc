/**
 * Cheap but effective hallucination guard: the model claims to quote a
 * chunk verbatim. We check that quote actually appears in the chunk text,
 * in code -- not by trusting the model's own "confidence" claim.
 */
function checkGrounding(llmResult, chunks) {
  const chunksByIndex = chunks.map((c) => c.content);

  const sourcesWithVerification = (llmResult.sources || []).map((source) => {
    const chunkContent = chunksByIndex[source.chunk_index - 1] || "";
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const verified = normalize(chunkContent).includes(normalize(source.quote || ""));

    return { ...source, verified };
  });

  const allVerified =
    sourcesWithVerification.length > 0 &&
    sourcesWithVerification.every((s) => s.verified);

  return {
    ...llmResult,
    sources: sourcesWithVerification,
    grounded: allVerified,
  };
}

module.exports = { checkGrounding };