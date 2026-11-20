import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Campo, Modal, Vazio } from '../components/Modal.jsx';
import { dataBR, hoje, kg } from '../rotulos.js';

/** Gera as linhas de séries a partir da prescrição do treino. */
const seriesDoTreino = (treino) =>
  treino.itens.flatMap((it) =>
    Array.from({ length: it.series }, (_, i) => ({
      exercicio_id: it.exercicio_id,
      exercicio_nome: it.exercicio_nome,
      numero_serie: i + 1,
      repeticoes: it.repeticoes_alvo,
      carga_kg: it.carga_kg,
      rpe: ''
    }))
  );

export default function Sessoes() {
  const { usuarioAtivo, avisar } = useApp();
  const [sessoes, setSessoes] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [form, setForm] = useState(null);

  const carregar = useCallback(async () => {
    if (!usuarioAtivo) return;
    try {
      const [s, t] = await Promise.all([
        api.listar('sessoes', { usuario_id: usuarioAtivo.id }),
        api.listar('treinos', { usuario_id: usuarioAtivo.id })
      ]);
      setSessoes(s);
      setTreinos(t);
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }, [usuarioAtivo, avisar]);

  useEffect(() => { carregar(); }, [carregar]);

  const escolherTreino = async (treinoId) => {
    if (!treinoId) return setForm({ ...form, treino_id: '', series: [] });
    const treino = await api.buscar('treinos', treinoId);
    setForm({ ...form, treino_id: treinoId, series: seriesDoTreino(treino) });
  };

  const nova = () => setForm({ treino_id: '', data: hoje(), duracao_min: '', rpe_sessao: '', observacoes: '', series: [] });

  const editar = async (id) => {
    try {
      const s = await api.buscar('sessoes', id);
      setForm({
        id: s.id, treino_id: s.treino_id, data: s.data, duracao_min: s.duracao_min ?? '', rpe_sessao: s.rpe_sessao ?? '',
        observacoes: s.observacoes ?? '', series: s.series.map((x) => ({ ...x, rpe: x.rpe ?? '' }))
      });
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const setCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const setSerie = (idx, campo) => (e) =>
    setForm({ ...form, series: form.series.map((s, i) => (i === idx ? { ...s, [campo]: e.target.value } : s)) });

  const salvar = async (e) => {
    e.preventDefault();
    try {
      if (form.id) await api.atualizar('sessoes', form.id, form);
      else await api.criar('sessoes', form);
      avisar(form.id ? 'Sessão atualizada.' : 'Sessão registrada. Confira as novas sugestões na Otimização.');
      setForm(null);
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const excluir = async (s) => {
    if (!window.confirm(`Excluir a sessão de ${dataBR(s.data)} (${s.treino_nome})?`)) return;
    try {
      await api.remover('sessoes', s.id);
      avisar('Sessão excluída.');
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  if (!usuarioAtivo) return <Vazio>Cadastre ou selecione um praticante para registrar sessões.</Vazio>;

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Sessões de treino</h1>
          <p>Registre o que foi realmente feito em cada série. Esses dados alimentam a otimização.</p>
        </div>
        <button className="btn" onClick={nova} disabled={!treinos.length} title={!treinos.length ? 'Crie um treino primeiro' : undefined}>+ Registrar sessão</button>
      </header>

      {sessoes.length === 0 ? <Vazio>Nenhuma sessão registrada ainda.</Vazio> : (
        <div className="tabela-caixa">
          <table>
            <thead><tr><th>Data</th><th>Treino</th><th>Duração</th><th>RPE</th><th>Séries</th><th>Volume</th><th /></tr></thead>
            <tbody>
              {sessoes.map((s) => (
                <tr key={s.id}>
                  <td><strong>{dataBR(s.data)}</strong></td>
                  <td>{s.treino_nome}</td>
                  <td>{s.duracao_min ? `${s.duracao_min} min` : '—'}</td>
                  <td>{s.rpe_sessao ?? '—'}</td>
                  <td>{s.total_series}</td>
                  <td>{kg(s.volume_kg)}</td>
                  <td className="acoes">
                    <button className="btn-link" onClick={() => editar(s.id)}>Editar</button>
                    <button className="btn-link perigo" onClick={() => excluir(s)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={form?.id ? 'Editar sessão' : 'Registrar sessão'} aberto={!!form} onFechar={() => setForm(null)} largo>
        {form && (
          <form onSubmit={salvar}>
            <div className="grade-form">
              <Campo rotulo="Treino *" largura={2}>
                <select required value={form.treino_id} onChange={(e) => escolherTreino(e.target.value)} disabled={!!form.id}>
                  <option value="">Selecione…</option>
                  {treinos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Data *"><input type="date" required max={hoje()} value={form.data} onChange={setCampo('data')} /></Campo>
              <Campo rotulo="Duração (min)"><input type="number" min="1" max="600" value={form.duracao_min} onChange={setCampo('duracao_min')} /></Campo>
              <Campo rotulo="RPE da sessão (1-10)"><input type="number" min="1" max="10" step="0.5" value={form.rpe_sessao} onChange={setCampo('rpe_sessao')} /></Campo>
              <Campo rotulo="Observações"><input value={form.observacoes} onChange={setCampo('observacoes')} /></Campo>
            </div>

            {form.series.length > 0 && (
              <>
                <h3 className="subtitulo">Séries realizadas</h3>
                <p className="texto-suave dica">RPE = esforço percebido (10 = falha; 8 = sobrariam ~2 repetições).</p>
                <div className="itens">
                  <div className="serie-linha item-cabecalho"><span>Exercício</span><span>Série</span><span>Reps</span><span>Carga (kg)</span><span>RPE</span><span /></div>
                  {form.series.map((s, idx) => (
                    <div className="serie-linha" key={idx}>
                      <span className="serie-nome">{s.exercicio_nome}</span>
                      <span>{s.numero_serie}ª</span>
                      <input type="number" min="0" max="100" required value={s.repeticoes} onChange={setSerie(idx, 'repeticoes')} aria-label="Repetições" />
                      <input type="number" min="0" step="0.5" value={s.carga_kg} onChange={setSerie(idx, 'carga_kg')} aria-label="Carga" />
                      <input type="number" min="1" max="10" step="0.5" value={s.rpe} onChange={setSerie(idx, 'rpe')} aria-label="RPE" />
                      <button type="button" className="btn-icone perigo" aria-label="Remover série"
                        onClick={() => setForm({ ...form, series: form.series.filter((_, i) => i !== idx) })}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="form-rodape">
              <button type="button" className="btn btn-sec" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn" disabled={!form.series.length}>Salvar sessão</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
