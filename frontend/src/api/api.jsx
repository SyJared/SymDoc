// In development this falls back to your local backend. In production,
// Vercel injects VITE_API_URL (set in its dashboard) pointing at your
// deployed Render backend instead -- same code, different target,
// decided by an environment variable rather than editing this file
// every time you switch between local and deployed.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Uploads a document either as pasted text OR a PDF file (pass one, not
 * both). Uses FormData instead of JSON.stringify -- FormData is the
 * browser's built-in way to build a multipart/form-data request, which
 * is required for file uploads. Notice we do NOT set a Content-Type
 * header here: the browser sets it automatically, including a special
 * "boundary" marker FormData needs, which we can't easily set by hand.
 */
export async function uploadDocument(title, { text, file } = {}) {
  const formData = new FormData();
  formData.append("title", title);

  if (file) {
    formData.append("file", file);
  } else if (text) {
    formData.append("text", text);
  }

  const res = await fetch(`${BASE_URL}/api/documents`, {
    method: "POST",
    body: formData,
    // no headers here on purpose -- see comment above
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/api/documents`);
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE_URL}/api/documents/${id}`, {
    method: "DELETE",
  });
  // 204 has no body -- don't try to res.json() it
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function askQuestion(question, documentId = null, history = []) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, documentId, history }),
  });
  if (!res.ok) throw new Error("Query failed");
  return res.json();
}