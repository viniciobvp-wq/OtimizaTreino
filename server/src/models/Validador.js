import { ValidationError } from '../errors.js';

const vazio = (v) => v === undefined || v === null || String(v).trim() === '';

/** Converte '' / undefined em null e strings numéricas em number. */
export const numOuNull = (v) => (vazio(v) ? null : Number(v));
export const textoOuNull = (v) => (vazio(v) ? null : String(v).trim());

/** Validador encadeável: acumula mensagens e lança ValidationError no final. */
export class Validador {
  constructor() {
    this.erros = [];
  }

  obrigatorio(v, campo) {
    if (vazio(v)) this.erros.push(`${campo} é obrigatório`);
    return this;
  }

  maxLen(v, campo, max) {
    if (!vazio(v) && String(v).length > max) {
      this.erros.push(`${campo} deve ter no máximo ${max} caracteres`);
    }
    return this;
  }

  numero(v, campo, { min, max, inteiro = false } = {}) {
    if (v === null || v === undefined) return this;
    const n = Number(v);
    if (!Number.isFinite(n) || (inteiro && !Number.isInteger(n))) {
      this.erros.push(`${campo} deve ser um número${inteiro ? ' inteiro' : ''}`);
      return this;
    }
    if (min !== undefined && n < min) this.erros.push(`${campo} deve ser no mínimo ${min}`);
    if (max !== undefined && n > max) this.erros.push(`${campo} deve ser no máximo ${max}`);
    return this;
  }

  email(v, campo) {
    if (!vazio(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      this.erros.push(`${campo} inválido`);
    }
    return this;
  }

  emLista(v, campo, lista) {
    if (!vazio(v) && !lista.includes(v)) {
      this.erros.push(`${campo} deve ser um de: ${lista.join(', ')}`);
    }
    return this;
  }

  data(v, campo) {
    if (vazio(v)) return this;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
    if (!ok) this.erros.push(`${campo} deve estar no formato AAAA-MM-DD`);
    return this;
  }

  adicionar(mensagem) {
    this.erros.push(mensagem);
    return this;
  }

  validar() {
    if (this.erros.length) throw new ValidationError(this.erros);
  }
}

/** Data de hoje (AAAA-MM-DD) no fuso horário local do servidor. */
export function hojeLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
