import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Campo, Modal, Vazio } from '../components/Modal.jsx';
import { NIVEIS, OBJETIVOS, dataBR } from '../rotulos.js';

const VAZIO = { nome: '', email: '', data_nascimento: '', peso_kg: '', altura_cm: '', objetivo: 'hipertrofia', nivel: 'iniciante' };

export default function Usuarios() {
  const { usuarios, usuarioAtivo, setUsuarioId, recarregarUsuarios, avisar } = useApp();
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const abrir = (u = null) => setForm(u ? { ...VAZIO, ...u, data_nascimento: u.data_nascimento ?? '', peso_kg: u.peso_kg ?? '', altura_cm: u.altura_cm ?? '' } : { ...VAZIO });
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const salvo = form.id ? await api.atualizar('usuarios', form.id, form) : await api.criar('usuarios', form);
      avisar(form.id ? 'Usuário atualizado.' : 'Usuário cadastrado.');
      setForm(null);
      await recarregarUsuarios();
      if (!form.id) setUsuarioId(salvo.id);
    } catch (err) {
      avisar(err.message, 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (u) => {
    if (!window.confirm(`Excluir ${u.nome}? Os treinos e sessões dele também serão apagados.`)) return;
    try {
      await api.remover('usuarios', u.id);
      avisar('Usuário excluído.');
      recarregarUsuarios();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  };

  const imc = (u) => (u.peso_kg && u.altura_cm ? (u.peso_kg / (u.altura_cm / 100) ** 2).toFixed(1).replace('.', ',') : '—');

  return (
    <section>
      <header className="pagina-topo">
        <div>
          <h1>Usuários</h1>
          <p>Praticantes cadastrados. O objetivo e o nível definem as faixas usadas na otimização.</p>
        </div>
        <button className="btn" onClick={() => abrir()}>+ Novo usuário</button>
      </header>

      {usuarios.length === 0 ? <Vazio>Nenhum usuário cadastrado ainda.</Vazio> : (
        <div className="tabela-caixa">
          <table>
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Nascimento</th><th>IMC</th><th>Objetivo</th><th>Nível</th><th /></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={u.id === usuarioAtivo?.id ? 'linha-ativa' : ''}>
                  <td><strong>{u.nome}</strong></td>
                  <td>{u.email}</td>
                  <td>{dataBR(u.data_nascimento)}</td>
                  <td>{imc(u)}</td>
                  <td>{OBJETIVOS[u.objetivo]}</td>
                  <td>{NIVEIS[u.nivel]}</td>
                  <td className="acoes">
                    {u.id !== usuarioAtivo?.id && <button className="btn-link" onClick={() => setUsuarioId(u.id)}>Selecionar</button>}
                    <button className="btn-link" onClick={() => abrir(u)}>Editar</button>
                    <button className="btn-link perigo" onClick={() => excluir(u)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={form?.id ? 'Editar usuário' : 'Novo usuário'} aberto={!!form} onFechar={() => setForm(null)}>
        {form && (
          <form onSubmit={salvar} className="grade-form">
            <Campo rotulo="Nome *" largura={2}><input required maxLength={100} value={form.nome} onChange={set('nome')} /></Campo>
            <Campo rotulo="E-mail *" largura={2}><input required type="email" maxLength={150} value={form.email} onChange={set('email')} /></Campo>
            <Campo rotulo="Data de nascimento"><input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} /></Campo>
            <Campo rotulo="Peso (kg)"><input type="number" step="0.1" min="20" max="400" value={form.peso_kg} onChange={set('peso_kg')} /></Campo>
            <Campo rotulo="Altura (cm)"><input type="number" step="0.1" min="80" max="260" value={form.altura_cm} onChange={set('altura_cm')} /></Campo>
            <Campo rotulo="Objetivo">
              <select value={form.objetivo} onChange={set('objetivo')}>
                {Object.entries(OBJETIVOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Nível">
              <select value={form.nivel} onChange={set('nivel')}>
                {Object.entries(NIVEIS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </Campo>
            <div className="form-rodape">
              <button type="button" className="btn btn-sec" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
