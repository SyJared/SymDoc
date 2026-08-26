import { useEffect, useState } from "react";
import Header from "./main/header";
import UploadForm from "./main/uploadForm";
import QueryChat from "./main/queryChat";
import DocumentList from "./main/documentList";
import { listDocuments } from "./api/api";

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const bumpRefresh = () => setRefreshTrigger((n) => n + 1);

  // App.jsx just needs the COUNT for the header badge -- DocumentList
  // still does its own fetch for the full list with titles/chunk counts,
  // since that's a slightly different shape of the same underlying data.
  useEffect(() => {
    listDocuments()
      .then((docs) => setDocumentCount(docs.length))
      .catch(() => setDocumentCount(0));
  }, [refreshTrigger]);

  return (
    <div className="page">
      <Header documentCount={documentCount} />

      <div className="app">
        <aside>
          <h2>Documents</h2>
          <DocumentList refreshTrigger={refreshTrigger} onDeleted={bumpRefresh} />
        </aside>

        <main>
          <section>
            <h2>1. Add a document</h2>
            <UploadForm onUploaded={bumpRefresh} />
          </section>

          <section>
            <h2>2. Ask a question</h2>
            <QueryChat refreshTrigger={refreshTrigger} />
          </section>
        </main>
      </div>
    </div>
  );
}