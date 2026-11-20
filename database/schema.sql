-- =============================================================
-- OtimizaTreino - Script de criação do banco de dados (MySQL 8+)
-- =============================================================
CREATE DATABASE IF NOT EXISTS otimiza_treino
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE otimiza_treino;

DROP TABLE IF EXISTS serie_realizada;
DROP TABLE IF EXISTS sessao;
DROP TABLE IF EXISTS treino_exercicio;
DROP TABLE IF EXISTS treino;
DROP TABLE IF EXISTS exercicio;
DROP TABLE IF EXISTS usuario;

-- Praticante que usa o sistema
CREATE TABLE usuario (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nome             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  data_nascimento  DATE NULL,
  peso_kg          DECIMAL(5,2) NULL,
  altura_cm        DECIMAL(5,2) NULL,
  objetivo         ENUM('hipertrofia','forca','resistencia','emagrecimento') NOT NULL DEFAULT 'hipertrofia',
  nivel            ENUM('iniciante','intermediario','avancado') NOT NULL DEFAULT 'iniciante',
  criado_em        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Catálogo de exercícios
CREATE TABLE exercicio (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nome             VARCHAR(100) NOT NULL UNIQUE,
  grupo_muscular   ENUM('peito','costas','ombros','biceps','triceps','quadriceps',
                        'posterior','gluteos','panturrilha','abdomen') NOT NULL,
  equipamento      VARCHAR(60) NULL,
  descricao        TEXT NULL
) ENGINE=InnoDB;

-- Ficha de treino (ex.: "Treino A - Peito e Tríceps")
CREATE TABLE treino (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT NOT NULL,
  nome             VARCHAR(80) NOT NULL,
  dia_semana       VARCHAR(20) NULL,
  observacoes      TEXT NULL,
  criado_em        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_treino_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Exercícios prescritos em cada ficha (tabela associativa treino N:N exercicio)
CREATE TABLE treino_exercicio (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  treino_id        INT NOT NULL,
  exercicio_id     INT NOT NULL,
  ordem            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  series           TINYINT UNSIGNED NOT NULL,
  repeticoes_alvo  TINYINT UNSIGNED NOT NULL,
  carga_kg         DECIMAL(6,2) NOT NULL DEFAULT 0,
  descanso_seg     SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  CONSTRAINT uq_treino_exercicio UNIQUE (treino_id, exercicio_id),
  CONSTRAINT fk_te_treino FOREIGN KEY (treino_id)
    REFERENCES treino(id) ON DELETE CASCADE,
  CONSTRAINT fk_te_exercicio FOREIGN KEY (exercicio_id)
    REFERENCES exercicio(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Sessão executada de uma ficha (um dia de treino)
CREATE TABLE sessao (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  treino_id        INT NOT NULL,
  data             DATE NOT NULL,
  duracao_min      SMALLINT UNSIGNED NULL,
  rpe_sessao       DECIMAL(3,1) NULL,
  observacoes      TEXT NULL,
  CONSTRAINT ck_sessao_rpe CHECK (rpe_sessao IS NULL OR rpe_sessao BETWEEN 1 AND 10),
  CONSTRAINT fk_sessao_treino FOREIGN KEY (treino_id)
    REFERENCES treino(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cada série efetivamente realizada numa sessão
CREATE TABLE serie_realizada (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  sessao_id        INT NOT NULL,
  exercicio_id     INT NOT NULL,
  numero_serie     TINYINT UNSIGNED NOT NULL,
  repeticoes       TINYINT UNSIGNED NOT NULL,
  carga_kg         DECIMAL(6,2) NOT NULL DEFAULT 0,
  rpe              DECIMAL(3,1) NULL,
  CONSTRAINT ck_serie_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  CONSTRAINT fk_serie_sessao FOREIGN KEY (sessao_id)
    REFERENCES sessao(id) ON DELETE CASCADE,
  CONSTRAINT fk_serie_exercicio FOREIGN KEY (exercicio_id)
    REFERENCES exercicio(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_sessao_data ON sessao (treino_id, data);
CREATE INDEX idx_serie_exercicio ON serie_realizada (exercicio_id);
