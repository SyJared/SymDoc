import { useEffect, useState } from "react";
import { listDocuments } from "../api/api";

/**
 * Sidebar showing every uploaded document. Re-fetches whenever
 * `refreshTrigger` changes -- App.jsx bumps that number after a
 * successful upload, so this list stays in sync without polling.
 */
export default function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [refreshTrigger]);

  if (status === "loading") return <p>Loading documents...</p>;
  if (status === "error") return <p className="error">Couldn't load documents.</p>;
  if (documents.length === 0) return <p>No documents uploaded yet.</p>;

  return (
    <ul className="document-list">
      {documents.map((doc) => (
        <li key={doc.id}>
          <strong>{doc.title}</strong>
          <span> — {doc.chunk_count} chunk(s)</span>
        </li>
      ))}
    </ul>
  );
}