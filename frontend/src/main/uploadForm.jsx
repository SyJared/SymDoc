import { useState } from "react";
import { uploadDocument } from "../api/api";

export default function UploadForm({ onUploaded }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    setStatus("loading");
    try {
      const result = await uploadDocument(title, text);
      setTitle("");
      setText("");
      setStatus("idle");
      onUploaded?.(result);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <input
        type="text"
        placeholder="Document title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Paste document text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
      />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Embedding..." : "Add document"}
      </button>
      {status === "error" && <p className="error">Upload failed. Is the backend running?</p>}
    </form>
  );
}