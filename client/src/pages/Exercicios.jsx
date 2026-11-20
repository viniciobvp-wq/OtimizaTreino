import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Campo, Modal, Vazio } from '../components/Modal.jsx';
import { GRUPOS } from '../rotulos.js';

const VAZIO = { nome: '', grupo_muscular: 'peito', equipamento: '', descricao: '' };

export default function Exercicios() {
  const { avisar } = useApp();
  const [lista, setLista] = useState([]);
  const [grupo, setGrupo] = useState('');
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setLista(await api.listar('exercicios', { grupo_muscular: grupo }));
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }, [grupo, avisar]);

  useEffect(() => { carregar(); }, [carregar]);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    try {
      if (form.id) await api.atualizar('exercicios', form.id, form);
      else await api.criar('exercicios', form);
      avisar(form.id ? 'Exercício atualizado.' : 'Exercício cadastrado.');
      setForm(null);
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const excluir = async (ex) => {
    if (!window.confirm(`Excluir o exercício "${ex.nome}"?`)) return;
    try {
      await api.remover('exercicios', ex.id);
      avisar('Exercício excluído.');
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const filtrados = lista.filter((ex) => ex.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Exercícios</h1>
          <p>Catálogo usado para montar as fichas. Cada exercício pertence a um grupo muscular.</p>
        </div>
        <button className="btn" onClick={() => setForm({ ...VAZIO })}>+ Novo exercício</button>
      </header>

      <div className="filtros">
        <input placeholder="Buscar por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Filtrar por grupo">
          <option value="">Todos os grupos</option>
          {Object.entries(GRUPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? <Vazio>Nenhum exercício encontrado.</Vazio> : (
        <div className="tabela-caixa">
          <table>
            <thead><tr><th>Nome</th><th>Grupo</th><th>Equipamento</th><th>Descrição</th><th /></tr></thead>
            <tbody>
              {filtrados.map((ex) => (
                <tr key={ex.id}>
                  <td><strong>{ex.nome}</strong></td>
                  <td><span className="tag">{GRUPOS[ex.grupo_muscular]}</span></td>
                  <td>{ex.equipamento || '—'}</td>
                  <td className="texto-suave">{ex.descricao || '—'}</td>
                  <td className="acoes">
                    <button className="btn-link" onClick={() => setForm({ ...VAZIO, ...ex, equipamento: ex.equipamento ?? '', descricao: ex.descricao ?? '' })}>Editar</button>
                    <button className="btn-link perigo" onClick={() => excluir(ex)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={form?.id ? 'Editar exercício' : 'Novo exercício'} aberto={!!form} onFechar={() => setForm(null)}>
        {form && (
          <form onSubmit={salvar} className="grade-form">
            <Campo rotulo="Nome *" largura={2}><input required maxLength={100} value={form.nome} onChange={set('nome')} /></Campo>
            <Campo rotulo="Grupo muscular *">
              <select value={form.grupo_muscular} onChange={set('grupo_muscular')}>
                {Object.entries(GRUPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Equipamento"><input maxLength={60} value={form.equipamento} onChange={set('equipamento')} /></Campo>
            <Campo rotulo="Descrição / execução" largura={2}><textarea rows={3} value={form.descricao} onChange={set('descricao')} /></Campo>
            <div className="form-rodape">
              <button type="button" className="btn btn-sec" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn">Salvar</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
