-- scripts/init_db.sql
-- Script de inicialização do banco de dados para o projeto EventFlow
-- Ajuste valores de usuário/senha conforme necessário antes de executar.

-- 1) Criar o banco de dados (se já existir, ignore a linha)
CREATE DATABASE IF NOT EXISTS `eventflow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Se quiser criar um usuário específico (opcional), descomente e ajuste as linhas abaixo:
-- CREATE USER 'eventflow_user'@'localhost' IDENTIFIED BY 'SUA_SENHA_SEMPLANTILHAS';
-- GRANT ALL PRIVILEGES ON `eventflow`.* TO 'eventflow_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Usar o banco criado
USE `eventflow`;

-- 2) Tabelas
-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `papel` ENUM('user','organizer','admin') NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: eventos
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `descricao` TEXT NOT NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `imagem` VARCHAR(255) DEFAULT NULL,
  `local` VARCHAR(255) NOT NULL,
  `data` DATE NOT NULL,
  `horario` VARCHAR(5) NOT NULL,
  `capacidade` INT NOT NULL,
  `inscricoes_atuais` INT NOT NULL DEFAULT 0,
  `status` ENUM('active','cancelled','completed') NOT NULL DEFAULT 'active',
  `organizador_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `eventos_organizador_idx` (`organizador_id`),
  CONSTRAINT `eventos_organizador_fk` FOREIGN KEY (`organizador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: inscricoes
CREATE TABLE IF NOT EXISTS `inscricoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `evento_id` INT NOT NULL,
  `status` ENUM('confirmed','cancelled','attended') NOT NULL DEFAULT 'confirmed',
  `data_inscricao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `inscricoes_usuario_evento_unique` (`usuario_id`,`evento_id`),
  KEY `inscricoes_usuario_idx` (`usuario_id`),
  KEY `inscricoes_evento_idx` (`evento_id`),
  CONSTRAINT `inscricoes_usuario_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inscricoes_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Índices e otimizações adicionais (opcionais)
-- Índice para busca por data e categoria
CREATE INDEX IF NOT EXISTS `eventos_data_idx` ON `eventos` (`data`);
CREATE INDEX IF NOT EXISTS `eventos_categoria_idx` ON `eventos` (`categoria`);

-- 4) Exemplo de inserção inicial (opcional)
-- INSERT INTO `usuarios` (`nome`,`email`,`senha`,`papel`) VALUES ('Admin','admin@example.com','$2a$10$EXEMPLO_HASH_SENHA','admin');

-- FIM do script

-- Observações:
-- 1) Execute esse script em um cliente MySQL (mysql CLI, MySQL Workbench ou phpMyAdmin).
-- 2) Se desejar que o Node.js crie o banco automaticamente, crie um pequeno script que conecte ao MySQL sem selecionar um database e execute os comandos acima.
-- 3) Ajuste collation/charset conforme sua necessidade.
