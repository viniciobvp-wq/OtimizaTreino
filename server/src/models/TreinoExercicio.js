import { Validador, numOuNull } from './Validador.js';

/** Item de uma ficha: um exercício com séries, repetições e carga prescritas. */
export class TreinoExercicio {
  static TABELA = 'treino_exercicio';

  constructor(dados = {}, ordemPadrao = 1) {
    this.id = dados.id ?? null;
    this.treino_id = dados.treino_id ?? null;
    this.exercicio_id = numOuNull(dados.exercicio_id);
    this.ordem = numOuNull(dados.ordem) ?? ordemPadrao;
    this.series = numOuNull(dados.series);
    this.repeticoes_alvo = numOuNull(dados.repeticoes_alvo);
    this.carga_kg = numOuNull(dados.carga_kg) ?? 0;
    this.descanso_seg = numOuNull(dados.descanso_seg) ?? 90;
  }

  validarEm(validador, rotulo) {
    validador
      .obrigatorio(this.exercicio_id, `${rotulo}: exercicio_id`)
      .obrigatorio(this.series, `${rotulo}: series`)
      .numero(this.series, `${rotulo}: series`, { min: 1, max: 10, inteiro: true })
      .obrigatorio(this.repeticoes_alvo, `${rotulo}: repeticoes_alvo`)
      .numero(this.repeticoes_alvo, `${rotulo}: repeticoes_alvo`, { min: 1, max: 50, inteiro: true })
      .numero(this.carga_kg, `${rotulo}: carga_kg`, { min: 0, max: 1000 })
      .numero(this.descanso_seg, `${rotulo}: descanso_seg`, { min: 0, max: 600, inteiro: true });
  }

  /** Volume planejado (tonelagem) = séries × repetições × carga. */
  volumePlanejado() {
    return this.series * this.repeticoes_alvo * this.carga_kg;
  }

  paraLinha(treinoId) {
    return {
      treino_id: treinoId,
      exercicio_id: this.exercicio_id,
      ordem: this.ordem,
      series: this.series,
      repeticoes_alvo: this.repeticoes_alvo,
      carga_kg: this.carga_kg,
      descanso_seg: this.descanso_seg
    };
  }
}
