import { pool, emTransacao } from '../db.js';
import { NotFoundError } from '../errors.js';
import { RepositorioBase } from './RepositorioBase.js';
import { Sessao } from '../models/Sessao.js';

export class SessaoRepositorio extends RepositorioBase {
  constructor() {
    super(Sessao, ['treino_id']);
  }

  async listar(filtros = {}) {
    const condicoes = [];
    const params = [];
    if (filtros.usuario_id) { condicoes.push('t.usuario_id = ?'); params.push(filtros.usuario_id); }
    if (filtros.treino_id) { condicoes.push('s.treino_id = ?'); params.push(filtros.treino_id); }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT s.*, t.nome AS treino_nome, t.usuario_id,
              COUNT(sr.id) AS total_series,
              COALESCE(SUM(sr.repeticoes * sr.carga_kg), 0) AS volume_kg
         FROM sessao s
         JOIN treino t ON t.id = s.treino_id
         LEFT JOIN serie_realizada sr ON sr.sessao_id = s.id
         ${where}
        GROUP BY s.id
        ORDER BY s.data DESC, s.id DESC`,
      params
    );
    return linhas;
  }

  async buscarPorId(id, conn = pool) {
    const [linhas] = await conn.query(
      `SELECT s.*, t.nome AS treino_nome, t.usuario_id
         FROM sessao s JOIN treino t ON t.id = s.treino_id
        WHERE s.id = ?`,
      [id]
    );
    if (!linhas.length) throw new NotFoundError('Sessão');
    const [series] = await conn.query(
      `SELECT sr.*, e.nome AS exercicio_nome, e.grupo_muscular
         FROM serie_realizada sr
         JOIN exercicio e ON e.id = sr.exercicio_id
        WHERE sr.sessao_id = ?
        ORDER BY sr.id`,
      [id]
    );
    return { ...linhas[0], series };
  }

  async #gravarSeries(conn, sessaoId, series) {
    await conn.query('DELETE FROM serie_realizada WHERE sessao_id = ?', [sessaoId]);
    for (const serie of series) {
      await conn.query('INSERT INTO serie_realizada SET ?', [serie.paraLinha(sessaoId)]);
    }
  }

  async criar(dados) {
    const sessao = new Sessao(dados).validar();
    return emTransacao(async (conn) => {
      const [t] = await conn.query('SELECT id FROM treino WHERE id = ?', [sessao.treino_id]);
      if (!t.length) throw new NotFoundError('Treino');
      const [r] = await conn.query('INSERT INTO sessao SET ?', [sessao.paraLinha()]);
      await this.#gravarSeries(conn, r.insertId, sessao.series);
      return this.buscarPorId(r.insertId, conn);
    });
  }

  async atualizar(id, dados) {
    const sessao = new Sessao(dados).validar();
    return emTransacao(async (conn) => {
      await this.buscarPorId(id, conn);
      await conn.query('UPDATE sessao SET ? WHERE id = ?', [sessao.paraLinha(), id]);
      await this.#gravarSeries(conn, id, sessao.series);
      return this.buscarPorId(id, conn);
    });
  }
}
