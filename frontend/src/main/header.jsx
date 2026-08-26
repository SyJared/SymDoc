export default function Header({ documentCount }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <img src="/logo.png" alt="SymDoc logo" className="brand-mark" />
          <div>
            <h1>SymDoc</h1>
            <p className="tagline">Ask questions, get answers grounded in your own documents.</p>
          </div>
        </div>

        {documentCount > 0 && (
          <div className="doc-count-badge">
            {documentCount} document{documentCount !== 1 ? "s" : ""} indexed
          </div>
        )}
      </div>
    </header>
  );
}