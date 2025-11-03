-- Migration SQL (Postgres) to add unique constraint to existing avaliacoes table
-- Execute: psql -d <db> -f scripts/add_unique_feedback_constraint.sql

-- Se a tabela já existir, adicionar a constraint
ALTER TABLE avaliacoes 
ADD CONSTRAINT unique_usuario_por_evento UNIQUE(evento_id, usuario_id);

-- Mensagem de sucesso
-- Se executou sem erro, a constraint foi aplicada com sucesso!
