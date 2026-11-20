import { pool } from '../db.js';
import { NotFoundError } from '../errors.js';
import { Usuario } from '../models/Usuario.js';
import { SerieRealizada } from '../models/SerieRealizada.js';
import { hojeLocal } from '../models/Validador.js';

/**
 * Regras de otimização de treino. A parte de cálculo (analisar) é pura —
 * recebe os dados já carregados — para facilitar testes automatizados.
 *
 * Base teórica (ver documentação):
 *  - Sobrecarga progressiva (ACSM, 2009);
 *  - Autorregulação por RPE / repetições em reserva (Helms et al., 2016);
 *  - Faixa de 10-20 séries semanais por grupo muscular (Schoenfeld et al., 2017);
 *  - 1RM estimado pela fórmula de Epley (1985).
 */
export class OtimizadorTreino {
  static FAIXAS_VOLUME = {
    iniciante: [6, 15],
    intermediario: [10, 20],
    avancado: [12, 22]
  };

  static FAIXAS_REPETICOES = {
    forca: [1, 6],
    hipertrofia: [6, 15],
    resistencia: [12, 30],
    emagrecimento: [8, 15]
  };

  static GRUPOS_PRINCIPAIS = ['peito', 'costas', 'ombros', 'quadriceps', 'posterior'];

  static ROTULOS_GRUPOS = {
    peito: 'peito', costas: 'costas', ombros: 'ombros', biceps: 'bíceps', triceps: 'tríceps',
    quadriceps: 'quadríceps', posterior: 'posterior de coxa', gluteos: 'glúteos',
    panturrilha: 'panturrilha', abdomen: 'abdômen'
  };

  static listarGrupos(grupos) {
    return grupos.map((g) => OtimizadorTreino.ROTULOS_GRUPOS[g] ?? g).join(', ');
  }

  /** Arredonda para o múltiplo de 0,5 kg mais próximo (anilhas comuns). */
  static arredondar(kg) {
    return Math.round(kg * 2) / 2;
  }

  /**
   * Decide a carga da próxima sessão a partir das séries da última sessão.
   * @returns {{acao: string, carga_sugerida: number, motivo: string}}
   */
  static sugerirCarga({ carga_kg, series, repeticoes_alvo }, seriesFeitas, rpeSessao = null) {
    if (!seriesFeitas.length) {
      return { acao: 'sem_dados', carga_sugerida: carga_kg, motivo: 'Nenhuma sessão registrada com este exercício.' };
    }
    const rpes = seriesFeitas.map((s) => s.rpe ?? rpeSessao).filter((r) => r != null);
    const rpeMedio = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 8;
    const repsMedias = seriesFeitas.reduce((a, s) => a + s.repeticoes, 0) / seriesFeitas.length;
    const cumpriu = seriesFeitas.length >= series && seriesFeitas.every((s) => s.repeticoes >= repeticoes_alvo);
    const rpeTxt = rpeMedio.toFixed(1).replace('.', ',');

    const ajustar = (fator, minimo) => {
      let nova = OtimizadorTreino.arredondar(carga_kg * fator);
      if (fator > 1 && nova - carga_kg < minimo) nova = carga_kg + minimo;
      if (fator < 1 && carga_kg - nova < minimo) nova = Math.max(0, carga_kg - minimo);
      return nova;
    };

    if (carga_kg === 0) {
      return cumpriu && rpeMedio <= 8
        ? { acao: 'aumentar', carga_sugerida: 0, motivo: `Exercício com peso corporal concluído com RPE ${rpeTxt}: aumente 1-2 repetições ou adicione carga.` }
        : { acao: 'manter', carga_sugerida: 0, motivo: 'Exercício com peso corporal: mantenha até completar as repetições-alvo.' };
    }
    if (repsMedias < repeticoes_alvo - 2 || rpeMedio >= 9.5) {
      return { acao: 'reduzir', carga_sugerida: ajustar(0.9, 0.5), motivo: `Média de ${repsMedias.toFixed(1).replace('.', ',')} repetições (alvo ${repeticoes_alvo}) com RPE ${rpeTxt}: carga acima da capacidade atual, reduza ~10%.` };
    }
    if (cumpriu && rpeMedio <= 7) {
      return { acao: 'aumentar', carga_sugerida: ajustar(1.05, 1), motivo: `Todas as séries completas com RPE ${rpeTxt} (3+ repetições em reserva): aumente ~5%.` };
    }
    if (cumpriu && rpeMedio <= 8.5) {
      return { acao: 'aumentar', carga_sugerida: ajustar(1.025, 0.5), motivo: `Todas as séries completas com RPE ${rpeTxt}: aumente ~2,5%.` };
    }
    if (cumpriu) {
      return { acao: 'manter', carga_sugerida: carga_kg, motivo: `Séries completas, mas com RPE ${rpeTxt} (perto da falha): consolide a carga antes de subir.` };
    }
    return { acao: 'manter', carga_sugerida: carga_kg, motivo: `Repetições-alvo ainda não atingidas em todas as séries (RPE ${rpeTxt}): mantenha a carga.` };
  }

  static diasEntre(dataA, dataB) {
    return Math.round((Date.parse(`${dataB}T00:00:00Z`) - Date.parse(`${dataA}T00:00:00Z`)) / 86400000);
  }

  /** Análise completa. `series` deve vir ordenada por data/sessão. */
  static analisar({ usuario, itens, series, sessoes, hoje = hojeLocal() }) {
    const alertas = [];
    const idade = (s) => OtimizadorTreino.diasEntre(s.data, hoje);

    // 1) Progressão de carga por item da ficha
    const progressao = itens.map((item) => {
      const doItem = series.filter((s) => s.treino_id === item.treino_id && s.exercicio_id === item.exercicio_id);
      const ultimaSessaoId = doItem.length ? doItem[doItem.length - 1].sessao_id : null;
      const daUltima = doItem.filter((s) => s.sessao_id === ultimaSessaoId);
      const sugestao = OtimizadorTreino.sugerirCarga(item, daUltima, daUltima[0]?.rpe_sessao ?? null);

      const [rMin, rMax] = OtimizadorTreino.FAIXAS_REPETICOES[usuario.objetivo];
      const observacao = item.repeticoes_alvo < rMin || item.repeticoes_alvo > rMax
        ? `Para o objetivo "${usuario.objetivo}" o recomendado é ${rMin}-${rMax} repetições.`
        : null;

      return {
        item_id: item.id,
        treino_id: item.treino_id,
        treino_nome: item.treino_nome,
        exercicio_id: item.exercicio_id,
        exercicio_nome: item.exercicio_nome,
        grupo_muscular: item.grupo_muscular,
        prescricao: `${item.series}x${item.repeticoes_alvo}`,
        carga_atual: item.carga_kg,
        ultima_sessao: daUltima[0]?.data ?? null,
        ...sugestao,
        observacao
      };
    });

    // 2) Volume semanal (séries) por grupo muscular
    const [vMin, vMax] = OtimizadorTreino.FAIXAS_VOLUME[usuario.nivel];
    const seriesSemana = series.filter((s) => idade(s) >= 0 && idade(s) < 7);
    const gruposNaFicha = [...new Set(itens.map((i) => i.grupo_muscular))];
    const volume_por_grupo = gruposNaFicha.map((grupo) => {
      const qtd = seriesSemana.filter((s) => s.grupo_muscular === grupo).length;
      const status = qtd < vMin ? 'abaixo' : qtd > vMax ? 'acima' : 'adequado';
      return { grupo, series_7d: qtd, faixa_min: vMin, faixa_max: vMax, status };
    }).sort((a, b) => a.grupo.localeCompare(b.grupo));

    const faltando = OtimizadorTreino.GRUPOS_PRINCIPAIS.filter((g) => !gruposNaFicha.includes(g));
    if (itens.length && faltando.length) {
      alertas.push({ tipo: 'equilibrio', mensagem: `Nenhum exercício para ${OtimizadorTreino.listarGrupos(faltando)} nas suas fichas. Considere incluir para equilibrar o treino.` });
    }
    const abaixo = volume_por_grupo.filter((g) => g.status === 'abaixo').map((g) => g.grupo);
    if (abaixo.length) {
      alertas.push({ tipo: 'volume', mensagem: `Volume semanal abaixo de ${vMin} séries para: ${OtimizadorTreino.listarGrupos(abaixo)}. Aumente a frequência ou o número de séries.` });
    }
    const acima = volume_por_grupo.filter((g) => g.status === 'acima').map((g) => g.grupo);
    if (acima.length) {
      alertas.push({ tipo: 'volume', mensagem: `Volume semanal acima de ${vMax} séries para: ${OtimizadorTreino.listarGrupos(acima)}. Risco de recuperação insuficiente.` });
    }

    // 3) Fadiga acumulada (média de RPE das 3 últimas sessões)
    const ultimas = sessoes.filter((s) => s.rpe_sessao != null).slice(0, 3);
    if (ultimas.length === 3) {
      const media = ultimas.reduce((a, s) => a + s.rpe_sessao, 0) / 3;
      if (media >= 9) {
        alertas.push({ tipo: 'fadiga', mensagem: `RPE médio de ${media.toFixed(1).replace('.', ',')} nas últimas 3 sessões: programe uma semana de deload (reduzir o volume em 40-50%).` });
      }
    }
    const diasSemTreino = sessoes.length ? idade(sessoes[0]) : null;
    if (diasSemTreino !== null && diasSemTreino > 7) {
      alertas.push({ tipo: 'frequencia', mensagem: `Último treino há ${diasSemTreino} dias. Ao retomar, reduza as cargas em ~10% na primeira semana.` });
    }

    // 4) Recordes: melhor 1RM estimado por exercício e evolução
    const porExercicio = new Map();
    for (const s of series) {
      const rm = SerieRealizada.epley(s.carga_kg, s.repeticoes);
      const reg = porExercicio.get(s.exercicio_id) ?? {
        exercicio_id: s.exercicio_id, exercicio_nome: s.exercicio_nome,
        primeiro_1rm: null, primeira_data: s.data, melhor_1rm: 0, data_melhor: null
      };
      if (reg.primeira_data === s.data) reg.primeiro_1rm = Math.max(reg.primeiro_1rm ?? 0, rm);
      if (rm > reg.melhor_1rm) { reg.melhor_1rm = rm; reg.data_melhor = s.data; }
      porExercicio.set(s.exercicio_id, reg);
    }
    const recordes = [...porExercicio.values()]
      .filter((r) => r.melhor_1rm > 0)
      .map((r) => ({
        ...r,
        evolucao_pct: r.primeiro_1rm ? Math.round(((r.melhor_1rm - r.primeiro_1rm) / r.primeiro_1rm) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.melhor_1rm - a.melhor_1rm);

    // 5) Resumo
    const volumeKg = (lista) => lista.reduce((a, s) => a + s.repeticoes * s.carga_kg, 0);
    const v7 = volumeKg(seriesSemana);
    const vAnt = volumeKg(series.filter((s) => idade(s) >= 7 && idade(s) < 14));
    const resumo = {
      sessoes_7d: sessoes.filter((s) => idade(s) >= 0 && idade(s) < 7).length,
      volume_kg_7d: v7,
      volume_kg_semana_anterior: vAnt,
      variacao_volume_pct: vAnt ? Math.round(((v7 - vAnt) / vAnt) * 1000) / 10 : null,
      sugestoes_aumento: progressao.filter((p) => p.acao === 'aumentar').length,
      sugestoes_reducao: progressao.filter((p) => p.acao === 'reduzir').length
    };

    return {
      usuario: { id: usuario.id, nome: usuario.nome, objetivo: usuario.objetivo, nivel: usuario.nivel, imc: usuario.calcularIMC() },
      resumo,
      alertas,
      progressao,
      volume_por_grupo,
      recordes
    };
  }

  /** Carrega os dados do banco e executa a análise. */
  async analisarUsuario(usuarioId) {
    const [u] = await pool.query('SELECT * FROM usuario WHERE id = ?', [usuarioId]);
    if (!u.length) throw new NotFoundError('Usuário');
    const usuario = new Usuario(u[0]);
    usuario.id = u[0].id;

    const [itens] = await pool.query(
      `SELECT te.*, t.nome AS treino_nome, e.nome AS exercicio_nome, e.grupo_muscular
         FROM treino_exercicio te
         JOIN treino t ON t.id = te.treino_id
         JOIN exercicio e ON e.id = te.exercicio_id
        WHERE t.usuario_id = ?
        ORDER BY t.nome, te.ordem`,
      [usuarioId]
    );
    const [series] = await pool.query(
      `SELECT sr.*, s.data, s.treino_id, s.rpe_sessao, e.nome AS exercicio_nome, e.grupo_muscular
         FROM serie_realizada sr
         JOIN sessao s ON s.id = sr.sessao_id
         JOIN treino t ON t.id = s.treino_id
         JOIN exercicio e ON e.id = sr.exercicio_id
        WHERE t.usuario_id = ?
        ORDER BY s.data, s.id, sr.numero_serie`,
      [usuarioId]
    );
    const [sessoes] = await pool.query(
      `SELECT s.* FROM sessao s JOIN treino t ON t.id = s.treino_id
        WHERE t.usuario_id = ? ORDER BY s.data DESC, s.id DESC`,
      [usuarioId]
    );
    return OtimizadorTreino.analisar({ usuario, itens, series, sessoes });
  }
}
