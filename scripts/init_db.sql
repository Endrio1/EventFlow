-- Complete migration for EventFlow (Postgres)
-- This consolidated init script includes schema creation and the
-- additional normalization triggers/indexes for CPF/CNPJ, phones and addresses.
-- Safe to run multiple times (uses IF NOT EXISTS and idempotent constructs).

-- Run with:
-- psql -d <db> -f scripts/init_db.sql

-- Notes:
-- - Review 'Remove duplicates' section before applying unique partial indexes if your
--   data may have duplicates (e.g., telefone_normalized, cpf_cnpj_normalized, avaliacoes).
-- - If you use pgAdmin, this script avoids nested DO $$ blocks and uses plain DDL/PLPGSQL.

BEGIN;

-- Ensure extension for digest exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  telefone VARCHAR(30),
  telefone_normalized VARCHAR(30),
  cpf_cnpj VARCHAR(30),
  cpf_cnpj_normalized VARCHAR(30),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP WITH TIME ZONE,
  endereco_id INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Populate normalized columns if missing (for existing DBs)
UPDATE usuarios
SET telefone_normalized = regexp_replace(coalesce(telefone,''), '\\D', '', 'g')
WHERE telefone IS NOT NULL AND (telefone_normalized IS NULL OR telefone_normalized = '');

UPDATE usuarios
SET cpf_cnpj_normalized = regexp_replace(coalesce(cpf_cnpj,''), '\\D', '', 'g')
WHERE cpf_cnpj IS NOT NULL AND (cpf_cnpj_normalized IS NULL OR cpf_cnpj_normalized = '');

-- Partial unique indexes to avoid duplicates when value present
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_telefone_normalized
  ON usuarios (telefone_normalized)
  WHERE telefone_normalized IS NOT NULL AND telefone_normalized <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_cpf_cnpj_normalized
  ON usuarios (cpf_cnpj_normalized)
  WHERE cpf_cnpj_normalized IS NOT NULL AND cpf_cnpj_normalized <> '';

-- Trigger function to normalize telefone
CREATE OR REPLACE FUNCTION usuarios_normalize_telefone()
RETURNS trigger AS $$
BEGIN
  NEW.telefone_normalized := regexp_replace(coalesce(NEW.telefone,''), '\\D', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_normalize_telefone ON usuarios;
CREATE TRIGGER trg_usuarios_normalize_telefone
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION usuarios_normalize_telefone();

-- Trigger function to normalize cpf/cnpj
CREATE OR REPLACE FUNCTION usuarios_normalize_cpfcnpj()
RETURNS trigger AS $$
BEGIN
  NEW.cpf_cnpj_normalized := regexp_replace(coalesce(NEW.cpf_cnpj,''), '\\D', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_normalize_cpfcnpj ON usuarios;
CREATE TRIGGER trg_usuarios_normalize_cpfcnpj
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION usuarios_normalize_cpfcnpj();

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
  organizer_id INTEGER,
  organizador_id INTEGER, -- legacy field name
  vendas_fechadas BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Keep both possible organizer fk columns if app uses either name; create FK only if column exists
ALTER TABLE eventos
  ADD CONSTRAINT IF NOT EXISTS fk_eventos_organizador_id FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON eventos(categoria);

-- =========================
-- 3) ENROLLMENTS (inscricoes)
-- =========================
CREATE TABLE IF NOT EXISTS inscricoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  evento_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','attended')),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, evento_id)
);

ALTER TABLE inscricoes ADD CONSTRAINT IF NOT EXISTS fk_inscricoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE inscricoes ADD CONSTRAINT IF NOT EXISTS fk_inscricoes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_inscricoes_usuario ON inscricoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_evento ON inscricoes(evento_id);

-- =========================
-- 4) FEEDBACKS (avaliacoes)
-- =========================
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(evento_id, usuario_id)
);

ALTER TABLE avaliacoes ADD CONSTRAINT IF NOT EXISTS fk_avaliacoes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
ALTER TABLE avaliacoes ADD CONSTRAINT IF NOT EXISTS fk_avaliacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_evento_id ON avaliacoes(evento_id);

-- =========================
-- 5) ADDRESSES (enderecos) - normalized table to avoid duplicates
-- =========================
CREATE TABLE IF NOT EXISTS enderecos (
  id SERIAL PRIMARY KEY,
  cep VARCHAR(20),
  rua VARCHAR(255),
  numero VARCHAR(50),
  complemento VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(100),
  estado VARCHAR(100),
  pais VARCHAR(100) DEFAULT 'BR',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  normalized_text TEXT,
  normalized_hash VARCHAR(64)
);

-- Populate normalized fields if missing (safe to run repeatedly)
UPDATE enderecos SET
  normalized_text = lower(regexp_replace(coalesce(cep,'') || ' ' || coalesce(rua,'') || ' ' || coalesce(numero,'') || ' ' || coalesce(complemento,'') || ' ' || coalesce(bairro,'') || ' ' || coalesce(cidade,'') || ' ' || coalesce(estado,'') || ' ' || coalesce(pais,''), '[^a-z0-9]+','','gi')),
  normalized_hash = encode(digest(coalesce(lower(regexp_replace(coalesce(cep,'') || ' ' || coalesce(rua,'') || ' ' || coalesce(numero,'') || ' ' || coalesce(complemento,'') || ' ' || coalesce(bairro,'') || ' ' || coalesce(cidade,'') || ' ' || coalesce(estado,'') || ' ' || coalesce(pais,'')),''), 'sha256'), 'hex')
WHERE normalized_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_enderecos_normalized_hash ON enderecos(normalized_hash);

-- Trigger function to update normalized text/hash
CREATE OR REPLACE FUNCTION enderecos_normalize_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.normalized_text := lower(regexp_replace(coalesce(NEW.cep,'') || ' ' || coalesce(NEW.rua,'') || ' ' || coalesce(NEW.numero,'') || ' ' || coalesce(NEW.complemento,'') || ' ' || coalesce(NEW.bairro,'') || ' ' || coalesce(NEW.cidade,'') || ' ' || coalesce(NEW.estado,'') || ' ' || coalesce(NEW.pais,''), '[^a-z0-9]+','','gi'));
  NEW.normalized_hash := encode(digest(coalesce(NEW.normalized_text,''), 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enderecos_normalize ON enderecos;
CREATE TRIGGER trg_enderecos_normalize
  BEFORE INSERT OR UPDATE ON enderecos
  FOR EACH ROW EXECUTE FUNCTION enderecos_normalize_trigger();

-- Add endereco_id foreign key to usuarios if table exists
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_id INTEGER;
ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuarios_endereco FOREIGN KEY (endereco_id) REFERENCES enderecos(id) ON DELETE SET NULL;

-- =========================
-- 6) Extras / compatibility and final adjustments
-- =========================
-- Ensure vendas_fechadas and ativo columns exist on eventos (backwards-compat)
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS vendas_fechadas BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Ensure reset password columns exist (already included in usuarios CREATE but keep idempotent alter)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;

-- Make sure organizer FK exists on eventos for legacy column organizador_id (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eventos' AND column_name='organizador_id') THEN
    BEGIN
      ALTER TABLE eventos ADD CONSTRAINT IF NOT EXISTS fk_eventos_organizador_id FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END$$;

COMMIT;

-- End of consolidated migration
