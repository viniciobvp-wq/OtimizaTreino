import { NavLink, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';
import Painel from './pages/Painel.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Exercicios from './pages/Exercicios.jsx';
import Treinos from './pages/Treinos.jsx';
import Sessoes from './pages/Sessoes.jsx';

const MENU = [
  { para: '/', texto: 'Otimização', icone: '📈' },
  { para: '/treinos', texto: 'Treinos', icone: '📋' },
  { para: '/sessoes', texto: 'Sessões', icone: '✅' },
  { para: '/exercicios', texto: 'Exercícios', icone: '🏋️' },
  { para: '/usuarios', texto: 'Usuários', icone: '👤' }
];

export default function App() {
  const { usuarios, usuarioAtivo, setUsuarioId, aviso } = useApp();

  return (
    <div className="layout">
      <aside className="lateral">
        <div className="marca">
          <span className="marca-logo">OT</span>
          <div>
            <strong>OtimizaTreino</strong>
            <small>treino guiado por dados</small>
          </div>
        </div>
        <nav>
          {MENU.map((m) => (
            <NavLink key={m.para} to={m.para} end={m.para === '/'} className="menu-item">
              <span aria-hidden="true">{m.icone}</span> {m.texto}
            </NavLink>
          ))}
        </nav>
        <div className="seletor-usuario">
          <label htmlFor="usuarioAtivo">Praticante ativo</label>
          <select
            id="usuarioAtivo"
            value={usuarioAtivo?.id ?? ''}
            onChange={(e) => setUsuarioId(Number(e.target.value) || null)}
          >
            {usuarios.length === 0 && <option value="">Nenhum cadastrado</option>}
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/treinos" element={<Treinos />} />
          <Route path="/sessoes" element={<Sessoes />} />
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Routes>
      </main>

      {aviso && <div key={aviso.chave} className={`aviso aviso-${aviso.tipo}`} role="status">{aviso.texto}</div>}
    </div>
  );
}
