import { Validador, textoOuNull } from './Validador.js';

export class Exercicio {
  static TABELA = 'exercicio';
  static NOME = 'Exercício';
  static ORDEM = 'nome';
  static GRUPOS = [
    'peito', 'costas', 'ombros', 'biceps', 'triceps',
    'quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'
  ];

  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.nome = textoOuNull(dados.nome);
    this.grupo_muscular = dados.grupo_muscular || null;
    this.equipamento = textoOuNull(dados.equipamento);
    this.descricao = textoOuNull(dados.descricao);
  }

  validar() {
    new Validador()
      .obrigatorio(this.nome, 'nome').maxLen(this.nome, 'nome', 100)
      .obrigatorio(this.grupo_muscular, 'grupo_muscular')
      .emLista(this.grupo_muscular, 'grupo_muscular', Exercicio.GRUPOS)
      .maxLen(this.equipamento, 'equipamento', 60)
      .validar();
    return this;
  }

  paraLinha() {
    const { nome, grupo_muscular, equipamento, descricao } = this;
    return { nome, grupo_muscular, equipamento, descricao };
  }
}
