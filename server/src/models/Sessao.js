import { Validador, numOuNull, textoOuNull, hojeLocal } from './Validador.js';
import { SerieRealizada } from './SerieRealizada.js';

/** Execução de um treino em uma data, com as séries realizadas. */
export class Sessao {
  static TABELA = 'sessao';
  static NOME = 'Sessão';
  static ORDEM = 'data DESC';

  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.treino_id = numOuNull(dados.treino_id);
    this.data = textoOuNull(dados.data);
    this.duracao_min = numOuNull(dados.duracao_min);
    this.rpe_sessao = numOuNull(dados.rpe_sessao);
    this.observacoes = textoOuNull(dados.observacoes);
    this.series = (dados.series || []).map((s) => new SerieRealizada(s));
  }

  validar() {
    const v = new Validador()
      .obrigatorio(this.treino_id, 'treino_id')
      .obrigatorio(this.data, 'data').data(this.data, 'data')
      .numero(this.duracao_min, 'duracao_min', { min: 1, max: 600, inteiro: true })
      .numero(this.rpe_sessao, 'rpe_sessao', { min: 1, max: 10 });

    if (this.data && this.data > hojeLocal()) {
      v.adicionar('data não pode estar no futuro');
    }
    if (this.series.length === 0) v.adicionar('registre pelo menos uma série');
    this.series.forEach((s, idx) => s.validarEm(v, `série ${idx + 1}`));

    v.validar();
    return this;
  }

  volumeTotal() {
    return this.series.reduce((soma, s) => soma + s.volume(), 0);
  }

  paraLinha() {
    const { treino_id, data, duracao_min, rpe_sessao, observacoes } = this;
    return { treino_id, data, duracao_min, rpe_sessao, observacoes };
  }
}
