// Real eval harness: hits your running SymDoc API for each QA pair and
// scores three SEPARATE things, because a RAG system can fail in three
// different places:
//   1. Retrieval  -- did vector search find the right document at all?
//   2. Relevance  -- does the final answer contain the expected fact?
//   3. Grounding  -- did it correctly say "I don't know" when it should
//                    have, instead of hallucinating a confident answer?
//
// Run: node run_eval.js   (with the backend already running on :5000)

const fs = require("fs");

const API_URL = "http://localhost:5000/api/query";

async function main() {
  const pairs = JSON.parse(fs.readFileSync("./qa_pairs.json", "utf-8"));

  let retrievalCorrect = 0;
  let retrievalApplicable = 0;
  let relevantCorrect = 0;
  let relevantApplicable = 0;
  let groundingCorrect = 0;

  for (const pair of pairs) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: pair.question }),
    });
    const result = await res.json();

    console.log(`\nQ: ${pair.question}`);
    console.log(`A: ${result.answer}`);

    // --- 1. Retrieval: did the top retrieved chunk come from the right doc? ---
    let retrievalNote = "n/a (no specific document expected)";
    if (pair.expected_document) {
      retrievalApplicable++;
      const topDoc = result.retrievedChunks?.[0]?.document_title;
      const isCorrect = topDoc === pair.expected_document;
      if (isCorrect) retrievalCorrect++;
      retrievalNote = isCorrect
        ? `correct (${topDoc})`
        : `WRONG - got "${topDoc}", expected "${pair.expected_document}"`;
    }
    console.log(`   retrieval: ${retrievalNote}`);

    // --- 2. Relevance: does the answer contain the expected keyword? ---
    let relevantNote = "n/a (no keyword expected)";
    if (pair.expected_answer_contains) {
      relevantApplicable++;
      const isRelevant = (result.answer || "")
        .toLowerCase()
        .includes(pair.expected_answer_contains.toLowerCase());
      if (isRelevant) relevantCorrect++;
      relevantNote = isRelevant ? "correct" : `WRONG - missing "${pair.expected_answer_contains}"`;
    }
    console.log(`   relevance: ${relevantNote}`);

    // --- 3. Grounding: did grounded match what we expect? ---
    const groundingMatches = result.grounded === pair.expect_grounded;
    if (groundingMatches) groundingCorrect++;
    console.log(
      `   grounding: ${groundingMatches ? "correct" : "WRONG"} (expected grounded=${pair.expect_grounded}, got grounded=${result.grounded})`
    );
  }

  console.log(`\n========== Summary ==========`);
  console.log(`Retrieval accuracy: ${retrievalCorrect}/${retrievalApplicable} (${pct(retrievalCorrect, retrievalApplicable)})`);
  console.log(`Answer relevance:   ${relevantCorrect}/${relevantApplicable} (${pct(relevantCorrect, relevantApplicable)})`);
  console.log(`Grounding accuracy: ${groundingCorrect}/${pairs.length} (${pct(groundingCorrect, pairs.length)})`);
}

function pct(num, denom) {
  if (denom === 0) return "n/a";
  return `${Math.round((num / denom) * 100)}%`;
}

main();

/*
LLM-as-judge upgrade (once this baseline works):
Instead of a keyword match for relevance, call Gemini with a prompt like:

  "Question: {question}
   Expected fact: {expected_answer_contains}
   Model's answer: {answer}
   Does the model's answer correctly convey the expected fact, even if
   worded differently? Reply with only YES or NO."

This catches cases where the answer is correct but phrased differently
than your exact keyword, at the cost of one extra API call per eval item.
*/