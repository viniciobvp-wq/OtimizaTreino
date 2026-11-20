import { Router } from 'express';

/** Gera as 5 rotas REST de CRUD para qualquer repositório. */
export function rotasCrud(repositorio) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await repositorio.listar(req.query));
  });

  router.get('/:id', async (req, res) => {
    res.json(await repositorio.buscarPorId(req.params.id));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await repositorio.criar(req.body));
  });

  router.put('/:id', async (req, res) => {
    res.json(await repositorio.atualizar(req.params.id, req.body));
  });

  router.delete('/:id', async (req, res) => {
    await repositorio.remover(req.params.id);
    res.status(204).end();
  });

  return router;
}
