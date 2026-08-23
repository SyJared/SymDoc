import { useState } from "react";
import { uploadDocument } from "../api/api";

export default function UploadForm({ onUploaded }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("text"); // "text" | "pdf"
  const [status, setStatus] = useState("idle"); // idle | loading | error

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected && selected.type !== "application/pdf") {
      setStatus("error");
      setFile(null);
      return;
    }
    setFile(selected || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (mode === "text" && !text.trim()) return;
    if (mode === "pdf" && !file) return;

    setStatus("loading");
    try {
      const result =
        mode === "pdf"
          ? await uploadDocument(title, { file })
          : await uploadDocument(title, { text });

      setTitle("");
      setText("");
      setFile(null);
      setStatus("idle");
      onUploaded?.(result);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
        >
          Paste text
        </button>
        <button
          type="button"
          className={mode === "pdf" ? "active" : ""}
          onClick={() => setMode("pdf")}
        >
          Upload PDF
        </button>
      </div>

      <input
        type="text"
        placeholder="Document title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {mode === "text" ? (
        <textarea
          placeholder="Paste document text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
      ) : (
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
      )}

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Processing..." : "Add document"}
      </button>

      {status === "error" && (
        <p className="error">
          {mode === "pdf" && !file
            ? "Please select a valid PDF file."
            : "Upload failed. Is the backend running?"}
        </p>
      )}
    </form>
  );
}