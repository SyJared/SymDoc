CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
DROP TABLE IF EXISTS chunks;

CREATE TABLE chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ivfflat index intentionally omitted: with few rows it can silently
-- miss real matches (the exact bug from earlier debugging). Without an
-- index, Postgres does an exact scan, which is more accurate and still
-- fast at this scale. Worth revisiting only once you have thousands
-- of chunks.