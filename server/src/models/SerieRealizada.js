import { numOuNull } from './Validador.js';

/** Uma série efetivamente executada durante uma sessão. */
export class SerieRealizada {
  static TABELA = 'serie_realizada';

  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.sessao_id = dados.sessao_id ?? null;
    this.exercicio_id = numOuNull(dados.exercicio_id);
    this.numero_serie = numOuNull(dados.numero_serie);
    this.repeticoes = numOuNull(dados.repeticoes);
    this.carga_kg = numOuNull(dados.carga_kg) ?? 0;
    this.rpe = numOuNull(dados.rpe);
  }

  validarEm(v, rotulo) {
    v.obrigatorio(this.exercicio_id, `${rotulo}: exercicio_id`)
      .obrigatorio(this.numero_serie, `${rotulo}: numero_serie`)
      .numero(this.numero_serie, `${rotulo}: numero_serie`, { min: 1, max: 20, inteiro: true })
      .obrigatorio(this.repeticoes, `${rotulo}: repeticoes`)
      .numero(this.repeticoes, `${rotulo}: repeticoes`, { min: 0, max: 100, inteiro: true })
      .numero(this.carga_kg, `${rotulo}: carga_kg`, { min: 0, max: 1000 })
      .numero(this.rpe, `${rotulo}: rpe`, { min: 1, max: 10 });
  }

  /** 1RM estimado pela fórmula de Epley: carga × (1 + reps/30). */
  estimar1RM() {
    return SerieRealizada.epley(this.carga_kg, this.repeticoes);
  }

  static epley(carga, repeticoes) {
    if (!carga || !repeticoes) return 0;
    if (repeticoes === 1) return carga;
    return Math.round(carga * (1 + repeticoes / 30) * 10) / 10;
  }

  volume() {
    return this.repeticoes * this.carga_kg;
  }

  paraLinha(sessaoId) {
    return {
      sessao_id: sessaoId,
      exercicio_id: this.exercicio_id,
      numero_serie: this.numero_serie,
      repeticoes: this.repeticoes,
      carga_kg: this.carga_kg,
      rpe: this.rpe
    };
  }
}
