import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Campo, Modal, Vazio } from '../components/Modal.jsx';
import { DIAS, GRUPOS, dataBR, kg } from '../rotulos.js';

const ITEM_VAZIO = { exercicio_id: '', series: 3, repeticoes_alvo: 10, carga_kg: 0, descanso_seg: 90 };

export default function Treinos() {
  const { usuarioAtivo, avisar } = useApp();
  const [treinos, setTreinos] = useState([]);
  const [detalhes, setDetalhes] = useState({});
  const [exercicios, setExercicios] = useState([]);
  const [form, setForm] = useState(null);

  const carregar = useCallback(async () => {
    if (!usuarioAtivo) return setTreinos([]);
    try {
      const lista = await api.listar('treinos', { usuario_id: usuarioAtivo.id });
      setTreinos(lista);
      const completos = await Promise.all(lista.map((t) => api.buscar('treinos', t.id)));
      setDetalhes(Object.fromEntries(completos.map((t) => [t.id, t])));
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }, [usuarioAtivo, avisar]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { api.listar('exercicios').then(setExercicios).catch(() => {}); }, []);

  const novo = () => setForm({ nome: '', dia_semana: '', observacoes: '', itens: [{ ...ITEM_VAZIO }] });
  const editar = (id) => {
    const t = detalhes[id];
    setForm({
      id: t.id, nome: t.nome, dia_semana: t.dia_semana ?? '', observacoes: t.observacoes ?? '',
      itens: t.itens.map(({ exercicio_id, series, repeticoes_alvo, carga_kg, descanso_seg }) => ({ exercicio_id, series, repeticoes_alvo, carga_kg, descanso_seg }))
    });
  };

  const setCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const setItem = (idx, campo) => (e) => {
    const itens = form.itens.map((it, i) => (i === idx ? { ...it, [campo]: e.target.value } : it));
    setForm({ ...form, itens });
  };
  const moverItem = (idx, delta) => {
    const itens = [...form.itens];
    const alvo = idx + delta;
    if (alvo < 0 || alvo >= itens.length) return;
    [itens[idx], itens[alvo]] = [itens[alvo], itens[idx]];
    setForm({ ...form, itens });
  };

  const salvar = async (e) => {
    e.preventDefault();
    const dados = { ...form, usuario_id: usuarioAtivo.id, itens: form.itens.map((it, i) => ({ ...it, ordem: i + 1 })) };
    try {
      if (form.id) await api.atualizar('treinos', form.id, dados);
      else await api.criar('treinos', dados);
      avisar(form.id ? 'Treino atualizado.' : 'Treino criado.');
      setForm(null);
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const excluir = async (t) => {
    if (!window.confirm(`Excluir "${t.nome}"? As sessões registradas deste treino também serão apagadas.`)) return;
    try {
      await api.remover('treinos', t.id);
      avisar('Treino excluído.');
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  if (!usuarioAtivo) return <Vazio>Cadastre ou selecione um praticante para ver os treinos.</Vazio>;

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Treinos de {usuarioAtivo.nome.split(' ')[0]}</h1>
          <p>Fichas com a prescrição de séries, repetições e carga de cada exercício.</p>
        </div>
        <button className="btn" onClick={novo}>+ Novo treino</button>
      </header>

      {treinos.length === 0 ? <Vazio>Nenhum treino cadastrado para este praticante.</Vazio> : (
        <div className="cartoes">
          {treinos.map((t) => (
            <article key={t.id} className="cartao">
              <header className="cartao-topo">
                <div>
                  <h3>{t.nome}</h3>
                  <small>{t.dia_semana || 'Sem dia fixo'} · última sessão: {dataBR(t.ultima_sessao)}</small>
                </div>
                <div className="acoes">
                  <button className="btn-link" onClick={() => editar(t.id)} disabled={!detalhes[t.id]}>Editar</button>
                  <button className="btn-link perigo" onClick={() => excluir(t)}>Excluir</button>
                </div>
              </header>
              <table className="tabela-compacta">
                <thead><tr><th>#</th><th>Exercício</th><th>Séries×Reps</th><th>Carga</th><th>Descanso</th></tr></thead>
                <tbody>
                  {(detalhes[t.id]?.itens || []).map((it, i) => (
                    <tr key={it.id}>
                      <td>{i + 1}</td>
                      <td>{it.exercicio_nome} <span className="texto-suave">· {GRUPOS[it.grupo_muscular]}</span></td>
                      <td>{it.series}×{it.repeticoes_alvo}</td>
                      <td>{kg(it.carga_kg)}</td>
                      <td>{it.descanso_seg}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {t.observacoes && <p className="texto-suave">{t.observacoes}</p>}
            </article>
          ))}
        </div>
      )}

      <Modal titulo={form?.id ? 'Editar treino' : 'Novo treino'} aberto={!!form} onFechar={() => setForm(null)} largo>
        {form && (
          <form onSubmit={salvar}>
            <div className="grade-form">
              <Campo rotulo="Nome *" largura={2}><input required maxLength={80} placeholder="Ex.: Treino A - Peito e Tríceps" value={form.nome} onChange={setCampo('nome')} /></Campo>
              <Campo rotulo="Dia da semana">
                <select value={form.dia_semana} onChange={setCampo('dia_semana')}>
                  <option value="">—</option>
                  {DIAS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Observações"><input value={form.observacoes} onChange={setCampo('observacoes')} /></Campo>
            </div>

            <h3 className="subtitulo">Exercícios</h3>
            <div className="itens">
              <div className="item-linha item-cabecalho">
                <span>Exercício</span><span>Séries</span><span>Reps</span><span>Carga (kg)</span><span>Descanso (s)</span><span />
              </div>
              {form.itens.map((it, idx) => (
                <div className="item-linha" key={idx}>
                  <select required value={it.exercicio_id} onChange={setItem(idx, 'exercicio_id')} aria-label="Exercício">
                    <option value="">Selecione…</option>
                    {exercicios.map((ex) => <option key={ex.id} value={ex.id}>{ex.nome} ({GRUPOS[ex.grupo_muscular]})</option>)}
                  </select>
                  <input type="number" min="1" max="10" required value={it.series} onChange={setItem(idx, 'series')} aria-label="Séries" />
                  <input type="number" min="1" max="50" required value={it.repeticoes_alvo} onChange={setItem(idx, 'repeticoes_alvo')} aria-label="Repetições" />
                  <input type="number" min="0" step="0.5" value={it.carga_kg} onChange={setItem(idx, 'carga_kg')} aria-label="Carga" />
                  <input type="number" min="0" max="600" step="15" value={it.descanso_seg} onChange={setItem(idx, 'descanso_seg')} aria-label="Descanso" />
                  <span className="item-botoes">
                    <button type="button" className="btn-icone" onClick={() => moverItem(idx, -1)} aria-label="Subir">↑</button>
                    <button type="button" className="btn-icone" onClick={() => moverItem(idx, 1)} aria-label="Descer">↓</button>
                    <button type="button" className="btn-icone perigo" onClick={() => setForm({ ...form, itens: form.itens.filter((_, i) => i !== idx) })} aria-label="Remover">×</button>
                  </span>
                </div>
              ))}
              <button type="button" className="btn btn-sec" onClick={() => setForm({ ...form, itens: [...form.itens, { ...ITEM_VAZIO }] })}>+ Adicionar exercício</button>
            </div>

            <div className="form-rodape">
              <button type="button" className="btn btn-sec" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn">Salvar treino</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
