import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { pool } from './db.js';
import { AppError } from './errors.js';
import { rotasCrud } from './routes/rotasCrud.js';
import { RepositorioBase } from './repositories/RepositorioBase.js';
import { TreinoRepositorio } from './repositories/TreinoRepositorio.js';
import { SessaoRepositorio } from './repositories/SessaoRepositorio.js';
import { Usuario } from './models/Usuario.js';
import { Exercicio } from './models/Exercicio.js';
import { OtimizadorTreino } from './services/OtimizadorTreino.js';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const treinos = new TreinoRepositorio();
  const otimizador = new OtimizadorTreino();

  app.get('/api/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'conectado' });
  });

  // Listas fixas usadas pelos formulários do front-end
  app.get('/api/opcoes', (_req, res) => {
    res.json({ objetivos: Usuario.OBJETIVOS, niveis: Usuario.NIVEIS, grupos: Exercicio.GRUPOS });
  });

  // CRUDs
  app.use('/api/usuarios', rotasCrud(new RepositorioBase(Usuario)));
  app.use('/api/exercicios', rotasCrud(new RepositorioBase(Exercicio, ['grupo_muscular'])));
  app.use('/api/treinos', rotasCrud(treinos));
  app.use('/api/sessoes', rotasCrud(new SessaoRepositorio()));

  // Otimização
  app.get('/api/usuarios/:id/otimizacao', async (req, res) => {
    res.json(await otimizador.analisarUsuario(req.params.id));
  });
  app.post('/api/treinos/:id/aplicar-sugestoes', async (req, res) => {
    res.json(await treinos.aplicarCargas(req.params.id, req.body.ajustes));
  });

  app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

  // Em produção, serve o front-end compilado (client/dist)
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // Tratamento centralizado de erros
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Já existe um registro com esse valor (campo único).' });
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ erro: 'Registro em uso por outros dados; não pode ser excluído.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ erro: 'Referência inválida: o registro relacionado não existe.' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  });

  return app;
}
