-- =============================================================
-- OtimizaTreino - Dados de exemplo (executar depois do schema.sql)
-- As datas das sessões são relativas ao dia atual, para que o
-- painel de otimização sempre tenha dados recentes.
-- =============================================================
USE otimiza_treino;

INSERT INTO usuario (nome, email, data_nascimento, peso_kg, altura_cm, objetivo, nivel) VALUES
  ('Maria Souza', 'maria@exemplo.com', '1999-04-12', 62.5, 165, 'hipertrofia', 'intermediario'),
  ('Pedro Lima',  'pedro@exemplo.com', '2003-09-30', 78.0, 180, 'forca',       'iniciante');

INSERT INTO exercicio (nome, grupo_muscular, equipamento, descricao) VALUES
  ('Supino reto',                   'peito',       'Barra',     'Deitado no banco reto, descer a barra até o peito e empurrar.'),
  ('Supino inclinado com halteres', 'peito',       'Halteres',  'Banco a 30-45 graus.'),
  ('Desenvolvimento com halteres',  'ombros',      'Halteres',  'Sentado, empurrar os halteres acima da cabeça.'),
  ('Elevação lateral',              'ombros',      'Halteres',  'Elevar os braços lateralmente até a linha dos ombros.'),
  ('Tríceps na polia com corda',    'triceps',     'Polia',     'Estender os cotovelos abrindo a corda no final.'),
  ('Agachamento livre',             'quadriceps',  'Barra',     'Barra nas costas, descer até pelo menos a paralela.'),
  ('Leg press 45°',                 'quadriceps',  'Máquina',   'Pés na largura dos ombros.'),
  ('Cadeira extensora',             'quadriceps',  'Máquina',   'Extensão completa dos joelhos.'),
  ('Stiff',                         'posterior',   'Barra',     'Flexão de quadril com joelhos semiflexionados.'),
  ('Remada curvada',                'costas',      'Barra',     'Tronco inclinado, puxar a barra até o abdômen.'),
  ('Puxada frontal',                'costas',      'Polia',     'Puxar a barra até a parte alta do peito.'),
  ('Rosca direta',                  'biceps',      'Barra',     'Flexão dos cotovelos sem balançar o tronco.'),
  ('Panturrilha em pé',             'panturrilha', 'Máquina',   'Flexão plantar completa.'),
  ('Prancha',                       'abdomen',     'Peso corporal', 'Isometria em apoio de antebraços.');

INSERT INTO treino (usuario_id, nome, dia_semana, observacoes) VALUES
  (1, 'Treino A - Peito, Ombros e Tríceps', 'Segunda', 'Foco em progressão no supino.'),
  (1, 'Treino B - Pernas',                  'Quarta',  NULL);

INSERT INTO treino_exercicio (treino_id, exercicio_id, ordem, series, repeticoes_alvo, carga_kg, descanso_seg) VALUES
  (1, 1, 1, 4, 8,  60,  120),
  (1, 3, 2, 3, 10, 16,  90),
  (1, 4, 3, 3, 12, 8,   60),
  (1, 5, 4, 3, 12, 25,  60),
  (2, 6, 1, 4, 6,  80,  180),
  (2, 7, 2, 3, 10, 180, 120),
  (2, 8, 3, 3, 12, 40,  60),
  (2, 9, 4, 3, 10, 50,  90);

INSERT INTO sessao (treino_id, data, duracao_min, rpe_sessao, observacoes) VALUES
  (1, CURDATE() - INTERVAL 9 DAY, 60, 7.5, NULL),
  (2, CURDATE() - INTERVAL 8 DAY, 70, 8.0, NULL),
  (1, CURDATE() - INTERVAL 2 DAY, 62, 8.0, 'Supino rendeu bem.'),
  (2, CURDATE() - INTERVAL 1 DAY, 68, 8.5, NULL);

INSERT INTO serie_realizada (sessao_id, exercicio_id, numero_serie, repeticoes, carga_kg, rpe) VALUES
  -- Sessão 1 (Treino A, semana anterior)
  (1, 1, 1, 8, 60, 8), (1, 1, 2, 8, 60, 8), (1, 1, 3, 8, 60, 8), (1, 1, 4, 7, 60, 8.5),
  (1, 3, 1, 10, 16, 8), (1, 3, 2, 10, 16, 8), (1, 3, 3, 9, 16, 8.5),
  (1, 4, 1, 12, 8, 8), (1, 4, 2, 12, 8, 8), (1, 4, 3, 11, 8, 8.5),
  (1, 5, 1, 12, 25, 8), (1, 5, 2, 11, 25, 8.5), (1, 5, 3, 10, 25, 9),
  -- Sessão 2 (Treino B, semana anterior)
  (2, 6, 1, 6, 75, 7.5), (2, 6, 2, 6, 75, 7.5), (2, 6, 3, 6, 75, 7.5), (2, 6, 4, 6, 75, 8),
  (2, 7, 1, 10, 170, 7), (2, 7, 2, 10, 170, 7), (2, 7, 3, 10, 170, 7.5),
  (2, 8, 1, 12, 40, 8), (2, 8, 2, 12, 40, 8), (2, 8, 3, 10, 40, 9),
  (2, 9, 1, 10, 50, 8), (2, 9, 2, 10, 50, 8), (2, 9, 3, 10, 50, 8),
  -- Sessão 3 (Treino A, esta semana)
  (3, 1, 1, 8, 60, 7), (3, 1, 2, 8, 60, 7), (3, 1, 3, 8, 60, 7), (3, 1, 4, 8, 60, 7),
  (3, 3, 1, 10, 16, 8.5), (3, 3, 2, 10, 16, 8.5), (3, 3, 3, 9, 16, 8.5),
  (3, 4, 1, 12, 8, 8), (3, 4, 2, 12, 8, 8), (3, 4, 3, 12, 8, 8),
  (3, 5, 1, 9, 25, 9.5), (3, 5, 2, 8, 25, 9.5), (3, 5, 3, 7, 25, 9.5),
  -- Sessão 4 (Treino B, esta semana)
  (4, 6, 1, 6, 80, 8), (4, 6, 2, 6, 80, 8), (4, 6, 3, 6, 80, 8), (4, 6, 4, 6, 80, 8),
  (4, 7, 1, 10, 180, 7), (4, 7, 2, 10, 180, 7), (4, 7, 3, 10, 180, 7),
  (4, 8, 1, 12, 40, 9), (4, 8, 2, 12, 40, 9), (4, 8, 3, 12, 40, 9),
  (4, 9, 1, 10, 50, 8.5), (4, 9, 2, 10, 50, 8.5), (4, 9, 3, 10, 50, 8.5);
