import { useState } from "react";
import UploadForm from "./main/uploadForm";
import QueryChat from "./main/queryChat";
import DocumentList from "./main/documentList";

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="app" style={{ display: "flex", gap: "2rem" }}>
      <aside style={{ width: "220px" }}>
        <h2>Documents</h2>
        <DocumentList refreshTrigger={refreshTrigger} />
      </aside>

      <main style={{ flex: 1 }}>
        <h1>SymDoc</h1>

        <section>
          <h2>1. Add a document</h2>
          <UploadForm onUploaded={() => setRefreshTrigger((n) => n + 1)} />
        </section>

        <section>
          <h2>2. Ask a question</h2>
          <QueryChat refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}