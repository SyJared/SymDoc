ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);