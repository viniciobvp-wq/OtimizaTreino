import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Vazio } from '../components/Modal.jsx';
import { ACOES, GRUPOS, NIVEIS, OBJETIVOS, dataBR, kg } from '../rotulos.js';

const ICONE_ALERTA = { volume: '📊', fadiga: '🔋', equilibrio: '⚖️', frequencia: '📅' };

export default function Painel() {
  const { usuarioAtivo, avisar } = useApp();
  const [dados, setDados] = useState(null);
  const [aplicando, setAplicando] = useState(null);

  const carregar = useCallback(async () => {
    if (!usuarioAtivo) return;
    try {
      setDados(await api.otimizacao(usuarioAtivo.id));
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }, [usuarioAtivo, avisar]);

  useEffect(() => { setDados(null); carregar(); }, [carregar]);

  if (!usuarioAtivo) {
    return <Vazio>Nenhum praticante selecionado. <Link to="/usuarios">Cadastre um usuário</Link> para começar.</Vazio>;
  }
  if (!dados) return <p className="texto-suave">Calculando…</p>;

  const { resumo, alertas, progressao, volume_por_grupo, recordes } = dados;

  // Agrupa as sugestões por treino
  const porTreino = progressao.reduce((acc, p) => {
    (acc[p.treino_id] ||= { nome: p.treino_nome, itens: [] }).itens.push(p);
    return acc;
  }, {});

  const aplicar = async (treinoId, itens) => {
    const ajustes = itens
      .filter((p) => (p.acao === 'aumentar' || p.acao === 'reduzir') && p.carga_sugerida !== p.carga_atual)
      .map((p) => ({ item_id: p.item_id, carga_kg: p.carga_sugerida }));
    setAplicando(treinoId);
    try {
      await api.aplicarSugestoes(treinoId, ajustes);
      avisar(`${ajustes.length} carga(s) atualizada(s) na ficha.`);
      await carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    } finally {
      setAplicando(null);
    }
  };

  const variacao = resumo.variacao_volume_pct;
  const maxVolume = Math.max(25, ...volume_por_grupo.map((g) => g.series_7d));

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Otimização de treino</h1>
          <p>
            {dados.usuario.nome} · {OBJETIVOS[dados.usuario.objetivo]} · {NIVEIS[dados.usuario.nivel]}
            {dados.usuario.imc && <> · IMC {String(dados.usuario.imc).replace('.', ',')}</>}
          </p>
        </div>
        <button className="btn btn-sec" onClick={carregar}>↻ Recalcular</button>
      </header>

      <div className="indicadores">
        <div className="indicador">
          <span>Sessões (7 dias)</span>
          <strong>{resumo.sessoes_7d}</strong>
        </div>
        <div className="indicador">
          <span>Volume (7 dias)</span>
          <strong>{kg(resumo.volume_kg_7d)}</strong>
          {variacao !== null && (
            <small className={variacao >= 0 ? 'positivo' : 'negativo'}>
              {variacao >= 0 ? '▲' : '▼'} {Math.abs(variacao).toString().replace('.', ',')}% vs. semana anterior
            </small>
          )}
        </div>
        <div className="indicador">
          <span>Cargas para aumentar</span>
          <strong className="positivo">{resumo.sugestoes_aumento}</strong>
        </div>
        <div className="indicador">
          <span>Cargas para reduzir</span>
          <strong className="negativo">{resumo.sugestoes_reducao}</strong>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="alertas">
          {alertas.map((a, i) => (
            <div key={i} className={`alerta alerta-${a.tipo}`}>
              <span aria-hidden="true">{ICONE_ALERTA[a.tipo]}</span> {a.mensagem}
            </div>
          ))}
        </div>
      )}

      <h2 className="secao-titulo">Progressão de carga sugerida</h2>
      {progressao.length === 0 ? (
        <Vazio>Crie um <Link to="/treinos">treino</Link> e registre <Link to="/sessoes">sessões</Link> para receber sugestões.</Vazio>
      ) : (
        Object.entries(porTreino).map(([treinoId, grupo]) => {
          const ajustaveis = grupo.itens.filter((p) => (p.acao === 'aumentar' || p.acao === 'reduzir') && p.carga_sugerida !== p.carga_atual);
          return (
            <article key={treinoId} className="cartao">
              <header className="cartao-topo">
                <h3>{grupo.nome}</h3>
                <button className="btn" disabled={!ajustaveis.length || aplicando === Number(treinoId)} onClick={() => aplicar(Number(treinoId), grupo.itens)}>
                  {ajustaveis.length ? `Aplicar ${ajustaveis.length} ajuste(s) na ficha` : 'Nada a aplicar'}
                </button>
              </header>
              <div className="tabela-rolagem">
                <table className="tabela-compacta">
                  <thead><tr><th>Exercício</th><th>Prescrição</th><th>Carga atual</th><th>Sugestão</th><th>Próxima carga</th><th>Por quê</th></tr></thead>
                  <tbody>
                    {grupo.itens.map((p) => (
                      <tr key={p.item_id}>
                        <td><strong>{p.exercicio_nome}</strong><br /><small className="texto-suave">última: {dataBR(p.ultima_sessao)}</small></td>
                        <td>{p.prescricao}</td>
                        <td>{kg(p.carga_atual)}</td>
                        <td><span className={`tag ${ACOES[p.acao].classe}`}>{ACOES[p.acao].texto}</span></td>
                        <td><strong>{kg(p.carga_sugerida)}</strong></td>
                        <td className="texto-suave motivo">
                          {p.motivo}
                          {p.observacao && <><br /><em>⚠ {p.observacao}</em></>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })
      )}

      <div className="duas-colunas">
        <article className="cartao">
          <h2 className="secao-titulo">Volume semanal por grupo</h2>
          <p className="texto-suave dica">Séries nos últimos 7 dias. Faixa recomendada para o nível: {volume_por_grupo[0] ? `${volume_por_grupo[0].faixa_min}–${volume_por_grupo[0].faixa_max}` : '—'} séries.</p>
          {volume_por_grupo.length === 0 ? <Vazio>Sem dados.</Vazio> : volume_por_grupo.map((g) => (
            <div key={g.grupo} className="barra-linha">
              <span className="barra-rotulo">{GRUPOS[g.grupo]}</span>
              <div className="barra-trilho">
                <div className="barra-faixa" style={{ left: `${(g.faixa_min / maxVolume) * 100}%`, width: `${((g.faixa_max - g.faixa_min) / maxVolume) * 100}%` }} />
                <div className={`barra-valor barra-${g.status}`} style={{ width: `${(g.series_7d / maxVolume) * 100}%` }} />
              </div>
              <span className="barra-numero">{g.series_7d}</span>
            </div>
          ))}
          <p className="legenda"><span className="leg-faixa" /> faixa recomendada <span className="leg-ok" /> adequado <span className="leg-baixo" /> abaixo <span className="leg-alto" /> acima</p>
        </article>

        <article className="cartao">
          <h2 className="secao-titulo">Recordes (1RM estimado)</h2>
          <p className="texto-suave dica">Fórmula de Epley: carga × (1 + repetições ÷ 30).</p>
          {recordes.length === 0 ? <Vazio>Sem sessões registradas.</Vazio> : (
            <table className="tabela-compacta">
              <thead><tr><th>Exercício</th><th>1RM</th><th>Data</th><th>Evolução</th></tr></thead>
              <tbody>
                {recordes.map((r) => (
                  <tr key={r.exercicio_id}>
                    <td>{r.exercicio_nome}</td>
                    <td><strong>{kg(r.melhor_1rm)}</strong></td>
                    <td>{dataBR(r.data_melhor)}</td>
                    <td className={r.evolucao_pct > 0 ? 'positivo' : 'texto-suave'}>
                      {r.evolucao_pct > 0 ? `+${String(r.evolucao_pct).replace('.', ',')}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </div>
    </section>
  );
}
