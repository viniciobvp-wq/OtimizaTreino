import { Validador, numOuNull, textoOuNull } from './Validador.js';
import { TreinoExercicio } from './TreinoExercicio.js';

/** Ficha de treino de um usuário, composta por itens (TreinoExercicio). */
export class Treino {
  static TABELA = 'treino';
  static NOME = 'Treino';
  static ORDEM = 'nome';

  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.usuario_id = numOuNull(dados.usuario_id);
    this.nome = textoOuNull(dados.nome);
    this.dia_semana = textoOuNull(dados.dia_semana);
    this.observacoes = textoOuNull(dados.observacoes);
    this.itens = (dados.itens || []).map((i, idx) => new TreinoExercicio(i, idx + 1));
  }

  validar() {
    const v = new Validador()
      .obrigatorio(this.usuario_id, 'usuario_id')
      .obrigatorio(this.nome, 'nome').maxLen(this.nome, 'nome', 80)
      .maxLen(this.dia_semana, 'dia_semana', 20);

    if (this.itens.length === 0) v.adicionar('o treino precisa ter pelo menos um exercício');
    this.itens.forEach((item, idx) => item.validarEm(v, `item ${idx + 1}`));

    const ids = this.itens.map((i) => i.exercicio_id);
    if (new Set(ids).size !== ids.length) v.adicionar('um exercício não pode aparecer duas vezes no mesmo treino');

    v.validar();
    return this;
  }

  volumePlanejado() {
    return this.itens.reduce((soma, i) => soma + i.volumePlanejado(), 0);
  }

  paraLinha() {
    const { usuario_id, nome, dia_semana, observacoes } = this;
    return { usuario_id, nome, dia_semana, observacoes };
  }
}
