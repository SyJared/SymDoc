import { useEffect, useState } from "react";
import { askQuestion, listDocuments } from "../api/api";

export default function QueryChat({ refreshTrigger }) {
  const [question, setQuestion] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(""); // "" means "all documents"
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error

  // Keep the dropdown in sync with whatever's actually been uploaded
  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => console.error(err));
  }, [refreshTrigger]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setStatus("loading");
    try {
      // "" (All documents) becomes null -- backend treats null as "search everything"
      const documentId = selectedDocId ? Number(selectedDocId) : null;
      const response = await askQuestion(question, documentId);
      setResult(response);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
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

      {status === "error" && <p className="error">Something went wrong. Is the backend running?</p>}

      {result && (
        <div className="result">
          <p className="answer">{result.answer}</p>

          <div className="badges">
            <span className={`badge confidence-${result.confidence}`}>
              Confidence: {result.confidence}
            </span>
            <span className={`badge grounded-${result.grounded}`}>
              {result.grounded ? "✓ Grounded" : "⚠ Not verified"}
            </span>
          </div>

          {result.sources?.length > 0 && (
            <div className="sources">
              <h4>Sources</h4>
              {result.sources.map((s, i) => (
                <div key={i} className={`source ${s.verified ? "verified" : "unverified"}`}>
                  <p>"{s.quote}"</p>
                  <small>{s.verified ? "✓ verified in document" : "✗ could not verify"}</small>
                </div>
              ))}
            </div>
          )}

          {result.retrievedChunks?.length > 0 && (
            <details>
              <summary>Retrieved chunks (debug)</summary>
              {result.retrievedChunks.map((c, i) => (
                <div key={i}>{c.document_title} — similarity: {c.similarity}</div>
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
}