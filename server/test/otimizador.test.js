import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OtimizadorTreino } from '../src/services/OtimizadorTreino.js';
import { SerieRealizada } from '../src/models/SerieRealizada.js';
import { Usuario } from '../src/models/Usuario.js';
import { Treino } from '../src/models/Treino.js';

const item = { carga_kg: 60, series: 4, repeticoes_alvo: 8 };
const serie = (repeticoes, rpe, carga_kg = 60) => ({ repeticoes, rpe, carga_kg });

test('Epley: 100 kg x 10 reps ≈ 133,3 kg', () => {
  assert.equal(SerieRealizada.epley(100, 10), 133.3);
  assert.equal(SerieRealizada.epley(100, 1), 100);
});

test('aumenta ~5% quando completa tudo com RPE baixo', () => {
  const r = OtimizadorTreino.sugerirCarga(item, [serie(8, 7), serie(8, 7), serie(8, 7), serie(8, 6.5)]);
  assert.equal(r.acao, 'aumentar');
  assert.equal(r.carga_sugerida, 63);
});

test('aumenta ~2,5% com RPE moderado', () => {
  const r = OtimizadorTreino.sugerirCarga(item, Array(4).fill(serie(8, 8)));
  assert.equal(r.acao, 'aumentar');
  assert.equal(r.carga_sugerida, 61.5);
});

test('mantém quando não completa as repetições', () => {
  const r = OtimizadorTreino.sugerirCarga(item, [serie(8, 8), serie(8, 8), serie(7, 9), serie(7, 9)]);
  assert.equal(r.acao, 'manter');
  assert.equal(r.carga_sugerida, 60);
});

test('reduz ~10% quando falha muito ou RPE ≥ 9,5', () => {
  const r = OtimizadorTreino.sugerirCarga(item, [serie(6, 9.5), serie(5, 10), serie(5, 10), serie(4, 10)]);
  assert.equal(r.acao, 'reduzir');
  assert.equal(r.carga_sugerida, 54);
});

test('sem dados quando não há sessões', () => {
  assert.equal(OtimizadorTreino.sugerirCarga(item, []).acao, 'sem_dados');
});

test('validação de usuário rejeita e-mail inválido', () => {
  assert.throws(() => new Usuario({ nome: 'A', email: 'x' }).validar(), /Dados inválidos/);
});

test('treino não aceita exercício repetido', () => {
  const t = new Treino({
    usuario_id: 1, nome: 'A',
    itens: [{ exercicio_id: 1, series: 3, repeticoes_alvo: 10 }, { exercicio_id: 1, series: 3, repeticoes_alvo: 10 }]
  });
  assert.throws(() => t.validar());
});

test('volume semanal classificado pela faixa do nível', () => {
  const usuario = new Usuario({ nome: 'A', email: 'a@a.com', nivel: 'intermediario' });
  const itens = [{ id: 1, treino_id: 1, exercicio_id: 1, grupo_muscular: 'peito', series: 4, repeticoes_alvo: 8, carga_kg: 60 }];
  const series = Array.from({ length: 4 }, (_, i) => ({
    sessao_id: 1, treino_id: 1, exercicio_id: 1, grupo_muscular: 'peito',
    numero_serie: i + 1, repeticoes: 8, carga_kg: 60, rpe: 7, data: '2026-01-10'
  }));
  const r = OtimizadorTreino.analisar({ usuario, itens, series, sessoes: [{ data: '2026-01-10', rpe_sessao: 7 }], hoje: '2026-01-11' });
  assert.equal(r.volume_por_grupo[0].series_7d, 4);
  assert.equal(r.volume_por_grupo[0].status, 'abaixo');
  assert.equal(r.progressao[0].acao, 'aumentar');
});
