import { useState } from "react";
import UploadForm from "./main/uploadForm";
import QueryChat from "./main/queryChat";

export default function App() {
  const [uploadCount, setUploadCount] = useState(0);

  return (
    <div className="app">
      <h1>DocMind</h1>
      <p>Upload documents, then ask questions about them.</p>

      <section>
        <h2>1. Add a document</h2>
        <UploadForm onUploaded={() => setUploadCount((n) => n + 1)} />
        {uploadCount > 0 && <p>{uploadCount} document(s) uploaded this session.</p>}
      </section>

      <section>
        <h2>2. Ask a question</h2>
        <QueryChat />
      </section>
    </div>
  );
}