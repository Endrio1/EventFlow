-- Migration SQL (Postgres) to add feedback/avaliacoes table
-- Execute: psql -d <db> -f scripts/add_feedback_table.sql

CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Um usuário pode dar apenas 1 feedback por evento
  UNIQUE(evento_id, usuario_id)
);

-- Index to speed up lookups by event
CREATE INDEX IF NOT EXISTS idx_avaliacoes_evento_id ON avaliacoes(evento_id);
