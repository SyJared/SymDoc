import { useEffect, useState } from "react";
import { listDocuments, deleteDocument } from "../api/api";

/**
 * onDeleted is a callback up to App.jsx -- when a document is removed
 * here, App bumps its shared refreshTrigger so QueryChat's dropdown
 * (which has its OWN separate copy of the document list) also updates.
 * Without this, you could delete a doc here but still see it selectable
 * in the query dropdown until the next unrelated refresh.
 */
export default function DocumentList({ refreshTrigger, onDeleted }) {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleDelete(id, title) {
    const confirmed = window.confirm(
      `Delete "${title}"? This removes it and all its chunks permanently.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteDocument(id);
      // Remove it from view immediately rather than waiting on a refetch
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      onDeleted?.();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="document-list">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }
  if (status === "error") return <p className="error">Couldn't load documents.</p>;
  if (documents.length === 0) return <p className="empty-state">No documents uploaded yet.</p>;

  return (
    <ul className="document-list">
      {documents.map((doc) => (
        <li key={doc.id}>
          <div className="doc-row">
            <div>
              <strong>{doc.title}</strong>
              <span> — {doc.chunk_count} chunk(s)</span>
            </div>
            <button
              type="button"
              className="delete-doc"
              onClick={() => handleDelete(doc.id, doc.title)}
              disabled={deletingId === doc.id}
              aria-label={`Delete ${doc.title}`}
            >
              {deletingId === doc.id ? "…" : "×"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}