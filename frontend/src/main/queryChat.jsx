import { useEffect, useState } from "react";
import { askQuestion, listDocuments } from "../api/api";

// How many prior turns to send with each new question. This is the actual
// "context management" decision -- too few and follow-ups lose context,
// too many and you're sending a growing wall of text with every request
// (slower, more tokens, more $$). 3 is a reasonable starting point.
const MAX_HISTORY_TURNS = 3;

export default function QueryChat({ refreshTrigger }) {
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [messages, setMessages] = useState([]); // [{question, result}, ...]
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => console.error(err));
  }, [refreshTrigger]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion("");
    setStatus("loading");

    // Build the trimmed history to send: last N turns, as plain
    // {question, answer} pairs -- the backend only needs the answer TEXT,
    // not the full result object with sources/confidence/etc.
    const recentHistory = messages.slice(-MAX_HISTORY_TURNS).map((m) => ({
      question: m.question,
      answer: m.result.answer,
    }));

    try {
      const documentId = selectedDocId ? Number(selectedDocId) : null;
      const result = await askQuestion(currentQuestion, documentId, recentHistory);
      setMessages((prev) => [...prev, { question: currentQuestion, result }]);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  function handleNewChat() {
    setMessages([]);
  }

  return (
    <div className="query-chat">
      <form onSubmit={handleAsk}>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
        >
          <option value="">All documents</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Thinking..." : "Ask"}
        </button>
      </form>

      {messages.length > 0 && (
        <button type="button" className="new-chat" onClick={handleNewChat}>
          New chat
        </button>
      )}

      {status === "error" && <p className="error">Something went wrong. Is the backend running?</p>}

      <div className="chat-thread">
        {messages.map((m, i) => (
          <div key={i} className="turn">
            <p className="user-question">{m.question}</p>

            <div className="result">
              <p className="answer">{m.result.answer}</p>

              <div className="badges">
                <span className={`badge confidence-${m.result.confidence}`}>
                  Confidence: {m.result.confidence}
                </span>
                <span className={`badge grounded-${m.result.grounded}`}>
                  {m.result.grounded ? "✓ Grounded" : "⚠ Not verified"}
                </span>
              </div>

              {m.result.sources?.length > 0 && (
                <div className="sources">
                  <h4>Sources</h4>
                  {m.result.sources.map((s, j) => (
                    <div key={j} className={`source ${s.verified ? "verified" : "unverified"}`}>
                      <p>"{s.quote}"</p>
                      <small>{s.verified ? "✓ verified in document" : "✗ could not verify"}</small>
                    </div>
                  ))}
                </div>
              )}

              {m.result.retrievedChunks?.length > 0 && (
                <details>
                  <summary>Retrieved chunks (debug)</summary>
                  {m.result.retrievedChunks.map((c, j) => (
                    <div key={j}>{c.document_title} — similarity: {c.similarity}</div>
                  ))}
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}