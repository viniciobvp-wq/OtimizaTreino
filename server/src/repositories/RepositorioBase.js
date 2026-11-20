import { pool } from '../db.js';
import { NotFoundError } from '../errors.js';

/**
 * CRUD genérico sobre uma tabela. Cada Modelo informa TABELA, NOME, ORDEM
 * e implementa validar() e paraLinha().
 */
export class RepositorioBase {
  constructor(Modelo, camposFiltro = []) {
    this.Modelo = Modelo;
    this.tabela = Modelo.TABELA;
    this.camposFiltro = camposFiltro;
  }

  async listar(filtros = {}) {
    const condicoes = [];
    const valores = [];
    for (const campo of this.camposFiltro) {
      if (filtros[campo] !== undefined && filtros[campo] !== '') {
        condicoes.push(`?? = ?`);
        valores.push(campo, filtros[campo]);
      }
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const [linhas] = await pool.query(
      `SELECT * FROM ?? ${where} ORDER BY ${this.Modelo.ORDEM}`,
      [this.tabela, ...valores]
    );
    return linhas;
  }

  async buscarPorId(id) {
    const [linhas] = await pool.query('SELECT * FROM ?? WHERE id = ?', [this.tabela, id]);
    if (!linhas.length) throw new NotFoundError(this.Modelo.NOME);
    return linhas[0];
  }

  async criar(dados) {
    const entidade = new this.Modelo(dados).validar();
    const [r] = await pool.query('INSERT INTO ?? SET ?', [this.tabela, entidade.paraLinha()]);
    return this.buscarPorId(r.insertId);
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id);
    const entidade = new this.Modelo(dados).validar();
    await pool.query('UPDATE ?? SET ? WHERE id = ?', [this.tabela, entidade.paraLinha(), id]);
    return this.buscarPorId(id);
  }

  async remover(id) {
    const [r] = await pool.query('DELETE FROM ?? WHERE id = ?', [this.tabela, id]);
    if (!r.affectedRows) throw new NotFoundError(this.Modelo.NOME);
  }
}
