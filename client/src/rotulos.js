export const OBJETIVOS = {
  hipertrofia: 'Hipertrofia',
  forca: 'Força',
  resistencia: 'Resistência',
  emagrecimento: 'Emagrecimento'
};

export const NIVEIS = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado'
};

export const GRUPOS = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  abdomen: 'Abdômen'
};

export const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const ACOES = {
  aumentar: { texto: 'Aumentar', classe: 'tag-verde' },
  manter: { texto: 'Manter', classe: 'tag-cinza' },
  reduzir: { texto: 'Reduzir', classe: 'tag-vermelha' },
  sem_dados: { texto: 'Sem dados', classe: 'tag-cinza' }
};

export const kg = (v) => `${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
export const dataBR = (d) => (d ? d.split('-').reverse().join('/') : '—');
export const hoje = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
