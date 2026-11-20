import { pool, emTransacao } from '../db.js';
import { NotFoundError, AppError } from '../errors.js';
import { RepositorioBase } from './RepositorioBase.js';
import { Treino } from '../models/Treino.js';

export class TreinoRepositorio extends RepositorioBase {
  constructor() {
    super(Treino, ['usuario_id']);
  }

  async listar(filtros = {}) {
    const params = [];
    let where = '';
    if (filtros.usuario_id) {
      where = 'WHERE t.usuario_id = ?';
      params.push(filtros.usuario_id);
    }
    const [linhas] = await pool.query(
      `SELECT t.*, u.nome AS usuario_nome,
              COUNT(te.id) AS total_exercicios,
              (SELECT MAX(s.data) FROM sessao s WHERE s.treino_id = t.id) AS ultima_sessao
         FROM treino t
         JOIN usuario u ON u.id = t.usuario_id
         LEFT JOIN treino_exercicio te ON te.treino_id = t.id
         ${where}
        GROUP BY t.id
        ORDER BY t.nome`,
      params
    );
    return linhas;
  }

  async buscarPorId(id, conn = pool) {
    const [linhas] = await conn.query('SELECT * FROM treino WHERE id = ?', [id]);
    if (!linhas.length) throw new NotFoundError('Treino');
    const [itens] = await conn.query(
      `SELECT te.*, e.nome AS exercicio_nome, e.grupo_muscular
         FROM treino_exercicio te
         JOIN exercicio e ON e.id = te.exercicio_id
        WHERE te.treino_id = ?
        ORDER BY te.ordem, te.id`,
      [id]
    );
    return { ...linhas[0], itens };
  }

  async #gravarItens(conn, treinoId, itens) {
    await conn.query('DELETE FROM treino_exercicio WHERE treino_id = ?', [treinoId]);
    for (const item of itens) {
      await conn.query('INSERT INTO treino_exercicio SET ?', [item.paraLinha(treinoId)]);
    }
  }

  async criar(dados) {
    const treino = new Treino(dados).validar();
    return emTransacao(async (conn) => {
      const [r] = await conn.query('INSERT INTO treino SET ?', [treino.paraLinha()]);
      await this.#gravarItens(conn, r.insertId, treino.itens);
      return this.buscarPorId(r.insertId, conn);
    });
  }

  async atualizar(id, dados) {
    const treino = new Treino(dados).validar();
    return emTransacao(async (conn) => {
      await this.buscarPorId(id, conn);
      await conn.query('UPDATE treino SET ? WHERE id = ?', [treino.paraLinha(), id]);
      await this.#gravarItens(conn, id, treino.itens);
      return this.buscarPorId(id, conn);
    });
  }

  /** Atualiza a carga prescrita de itens do treino (usado pela otimização). */
  async aplicarCargas(treinoId, ajustes) {
    if (!Array.isArray(ajustes) || ajustes.length === 0) {
      throw new AppError(400, 'Informe ao menos um ajuste de carga');
    }
    return emTransacao(async (conn) => {
      await this.buscarPorId(treinoId, conn);
      for (const { item_id, carga_kg } of ajustes) {
        const carga = Number(carga_kg);
        if (!Number.isFinite(carga) || carga < 0 || carga > 1000) {
          throw new AppError(400, `Carga inválida para o item ${item_id}`);
        }
        const [r] = await conn.query(
          'UPDATE treino_exercicio SET carga_kg = ? WHERE id = ? AND treino_id = ?',
          [carga, item_id, treinoId]
        );
        if (!r.affectedRows) throw new AppError(400, `Item ${item_id} não pertence ao treino`);
      }
      return this.buscarPorId(treinoId, conn);
    });
  }
}
