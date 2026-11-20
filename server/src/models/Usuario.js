import { Validador, numOuNull, textoOuNull } from './Validador.js';

export class Usuario {
  static TABELA = 'usuario';
  static NOME = 'Usuário';
  static ORDEM = 'nome';
  static OBJETIVOS = ['hipertrofia', 'forca', 'resistencia', 'emagrecimento'];
  static NIVEIS = ['iniciante', 'intermediario', 'avancado'];

  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.nome = textoOuNull(dados.nome);
    this.email = textoOuNull(dados.email)?.toLowerCase() ?? null;
    this.data_nascimento = textoOuNull(dados.data_nascimento);
    this.peso_kg = numOuNull(dados.peso_kg);
    this.altura_cm = numOuNull(dados.altura_cm);
    this.objetivo = dados.objetivo || 'hipertrofia';
    this.nivel = dados.nivel || 'iniciante';
  }

  validar() {
    new Validador()
      .obrigatorio(this.nome, 'nome').maxLen(this.nome, 'nome', 100)
      .obrigatorio(this.email, 'email').email(this.email, 'email').maxLen(this.email, 'email', 150)
      .data(this.data_nascimento, 'data_nascimento')
      .numero(this.peso_kg, 'peso_kg', { min: 20, max: 400 })
      .numero(this.altura_cm, 'altura_cm', { min: 80, max: 260 })
      .emLista(this.objetivo, 'objetivo', Usuario.OBJETIVOS)
      .emLista(this.nivel, 'nivel', Usuario.NIVEIS)
      .validar();
    return this;
  }

  /** Índice de massa corporal (kg/m²) ou null se faltar peso/altura. */
  calcularIMC() {
    if (!this.peso_kg || !this.altura_cm) return null;
    const m = this.altura_cm / 100;
    return Math.round((this.peso_kg / (m * m)) * 10) / 10;
  }

  paraLinha() {
    const { nome, email, data_nascimento, peso_kg, altura_cm, objetivo, nivel } = this;
    return { nome, email, data_nascimento, peso_kg, altura_cm, objetivo, nivel };
  }
}
