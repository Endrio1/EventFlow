-- Complete migration for EventFlow (Postgres)
-- This file consolidates the database DDL changes made during development.
-- Run with: psql -d <db> -f scripts/complete_migration.sql

-- IMPORTANT NOTES:
-- 1) If your database already contains data (especially in "avaliacoes"),
--    make sure to check and remove duplicates on (evento_id, usuario_id)
--    BEFORE applying the unique index/constraint. See the section "Remove duplicates".
-- 2) This script uses "CREATE ... IF NOT EXISTS" where applicable so it is safe
--    to run multiple times (idempotent in most parts).
-- 3) Review and adapt timestamps/column names to match your current schema if needed.

BEGIN;

-- =========================
-- 1) USERS (usuarios)
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  papel VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (papel IN ('user','organizer','admin')),
  avatar VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =========================
-- 2) EVENTS (eventos)
-- =========================
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  imagem VARCHAR(255),
  local VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  horario VARCHAR(10) NOT NULL,
  capacidade INTEGER NOT NULL,
  inscricoes_atuais INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','completed')),
  organizador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vendas_fechadas BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos(categoria);

-- =========================
-- 3) ENROLLMENTS (inscricoes)
-- =========================
CREATE TABLE IF NOT EXISTS inscricoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','attended')),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, evento_id)
);

CREATE INDEX IF NOT EXISTS idx_inscricoes_usuario ON inscricoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_evento ON inscricoes(evento_id);

-- =========================
-- 4) FEEDBACKS (avaliacoes)
-- =========================
-- Create table if not exists (includes UNIQUE(evento_id, usuario_id))
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(evento_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_evento_id ON avaliacoes(evento_id);

-- =========================
-- 5) Optional: If you already created avaliacoes earlier without the UNIQUE constraint,
--    and you received an error about duplicates, use the block below to remove duplicates
--    while keeping the most recent row per (evento_id, usuario_id). This block is
--    commented out by default. Uncomment and run if you need to de-duplicate.
--
-- NOTE: This will create a backup table `avaliacoes_backup` before deleting rows.
--
-- BEGIN;
--
-- -- backup
-- CREATE TABLE IF NOT EXISTS avaliacoes_backup AS TABLE avaliacoes;
--
-- -- delete duplicates, keep most recent (by criado_em, then id)
-- WITH ranked AS (
--   SELECT id,
--     ROW_NUMBER() OVER (PARTITION BY evento_id, usuario_id ORDER BY criado_em DESC, id DESC) AS rn
--   FROM avaliacoes
-- )
-- DELETE FROM avaliacoes
-- WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
--
-- COMMIT;

-- If you performed the deduplication step above, apply the unique index now.
-- If the table was created above with the UNIQUE constraint, this step will be a no-op.
--
-- CREATE UNIQUE INDEX IF NOT EXISTS unique_avaliacoes_evento_usuario ON avaliacoes(evento_id, usuario_id);

-- =========================
-- 6) Extras / compatibility
-- =========================
-- If you want to ensure the events table has the vendas_fechadas column (for older DBs):
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS vendas_fechadas BOOLEAN NOT NULL DEFAULT false;

-- Add password reset columns to usuarios table if they don't exist:
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;

-- Final commit
COMMIT;

-- End of migration
