# SymDoc

**Ask questions, get answers grounded in your own documents.**

SymDoc is a full-stack Retrieval-Augmented Generation (RAG) application. Upload a document, ask a question about it, and get back an answer that's actually verified against the source text — not just a confident-sounding guess.

> ⚠️ **Heads up: this runs entirely on free-tier infrastructure.** Questions can occasionally fail or feel slow — see [Known Limitations](#known-limitations-please-read) before assuming something's broken.

**Live demo:** `https://sym-doc-tau.vercel.app/`
**Backend health check:** `https://symdoc.onrender.com/api/health`

---

## What it actually does

1. **Upload** a document (pasted text or a PDF).
2. The backend splits it into overlapping chunks, generates a vector embedding for each one (Voyage AI), and stores them in Postgres using the `pgvector` extension.
3. **Ask a question.** Your question is embedded the same way, and Postgres finds the chunks whose meaning is closest to it — real semantic search, not keyword matching.
4. Those chunks get handed to an LLM (Google Gemini) along with your question, constrained to a structured JSON response: an answer, a confidence level, and cited quotes.
5. A separate grounding check **verifies** those quotes actually exist in the retrieved chunks before showing you the answer — decoupling the model's own confidence claim from a code-checked fact.

If the documents don't contain the answer, SymDoc says so instead of guessing.

---

## Features

- 📄 Upload documents as pasted text **or** real PDF files
- 🔍 Semantic vector search (pgvector + cosine similarity), not keyword search
- 🧠 Structured LLM output — answer, confidence, and cited sources every time
- ✅ Hallucination mitigation — every cited quote is verified against the source text in code
- 💬 Multi-turn conversation — follow-up questions understand prior context
- 🎯 Per-document filtering — ask across everything, or scope to one document
- 🗑️ Delete documents (cascades to their chunks automatically)
- 🛡️ Rate limiting on uploads and queries to protect free-tier API quotas
- 📊 A real evaluation suite — measures retrieval accuracy, answer relevance, and grounding correctness separately, not just "did it work"

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), plain CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL + `pgvector` (hosted on Neon) |
| Embeddings | Voyage AI (`voyage-4-lite`) |
| LLM | Google Gemini (`gemini-flash-latest`), structured JSON output |
| PDF parsing | `pdf-parse` |
| File uploads | `multer` |
| Rate limiting | `express-rate-limit` |
| Hosting | Render (backend), Vercel (frontend), Neon (database) |

---

## Known limitations (please read)

This project runs entirely on **free tiers**, on purpose — it's a learning/portfolio project, not a funded product. That comes with real, visible tradeoffs:

- **The backend sleeps.** Render's free tier spins the server down after ~15 minutes of no traffic. The *first* request after a period of inactivity can take **30–60 seconds** to respond while it wakes back up. This is not a bug — if a question seems to hang, give it a minute before assuming it failed.
- **The LLM can be temporarily overloaded.** Google's Gemini free tier occasionally returns a `503 (high demand)` error at peak times. If a question fails, waiting a few seconds and asking again usually resolves it.
- **Rate limits are intentionally tight.** To avoid burning through free embedding/LLM quota, this app limits each visitor to roughly 10 questions and 3 uploads per 15 minutes. Hitting the limit returns a clear error, not a crash.
- **No spending risk, but usage risk.** Both API keys have $0 spending caps set — nothing can ever bill unexpectedly — but that also means if free-tier quota runs out, requests fail gracefully rather than "just working" regardless of cost.
- **Documents are currently shared, not private.** There's no user login — anyone using the live demo can see, query, and delete the same documents. Don't rely on it for anything sensitive. *(If you're reading this after a later update, check whether this has since been changed to a read-only or per-visitor demo.)*

None of this reflects the actual RAG pipeline's correctness — it's infrastructure-level tradeoffs that come from deliberately choosing $0-cost hosting.

---

## Local development setup

### Prerequisites
- Node.js 18+
- Docker (for local Postgres + pgvector), or a native Postgres install with the `pgvector` extension
- API keys: [Voyage AI](https://voyageai.com) and [Google AI Studio](https://aistudio.google.com) (both have free tiers)

### 1. Database
```bash
docker run --name symdoc-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d pgvector/pgvector:pg16
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, GEMINI_API_KEY, VOYAGE_API_KEY
psql postgresql://postgres:postgres@localhost:5433/postgres -f src/db/schema.sql
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5000` for the backend in development; set `VITE_API_URL` to override (used for pointing at a deployed backend in production).

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Basic liveness check |
| `POST` | `/api/documents` | Upload a document (text or PDF, multipart) |
| `GET` | `/api/documents` | List all documents with chunk counts |
| `DELETE` | `/api/documents/:id` | Delete a document and its chunks |
| `POST` | `/api/query` | Ask a question — optionally scoped to one document, with conversation history |

---

## Evaluation

`eval/run_eval.js` scores the pipeline against `eval/qa_pairs.json` on three separate axes:

- **Retrieval accuracy** — did vector search find the correct source document?
- **Answer relevance** — does the generated answer contain the expected fact?
- **Grounding correctness** — did it correctly refuse to answer questions the documents don't cover, instead of hallucinating?

```bash
cd eval
node run_eval.js
```

---

## Possible future improvements

- Query rewriting for multi-turn follow-ups (resolve "what about X?" before embedding)
- Re-ranking retrieved chunks with the LLM before generating an answer
- Automatic retry on transient LLM `503` errors
- Per-visitor document isolation or a read-only public demo mode
- Streaming responses instead of waiting for the full answer

---

## Author

Symmon Jared Gagaring — [GitHub](https://github.com/SyJared) · [Portfolio](https://symmon-portfolio.vercel.app)
