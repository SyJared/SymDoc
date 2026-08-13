const BASE_URL = "http://localhost:3001";

export async function uploadDocument(title, text) {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/api/documents`);
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

export async function askQuestion(question) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Query failed");
  return res.json();
}