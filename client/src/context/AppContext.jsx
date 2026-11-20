import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AppContext = createContext(null);

const lerSalvo = () => {
  try { return Number(localStorage.getItem('usuarioAtivo')) || null; } catch { return null; }
};

/** Guarda o usuário ativo (praticante selecionado) e as mensagens de aviso. */
export function AppProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioIdState] = useState(lerSalvo);
  const [aviso, setAviso] = useState(null);

  const setUsuarioId = (id) => {
    setUsuarioIdState(id);
    try { localStorage.setItem('usuarioAtivo', id ?? ''); } catch { /* sem storage */ }
  };

  const avisar = useCallback((texto, tipo = 'sucesso') => {
    setAviso({ texto, tipo, chave: Date.now() });
  }, []);

  const recarregarUsuarios = useCallback(async () => {
    try {
      const lista = await api.listar('usuarios');
      setUsuarios(lista);
      setUsuarioIdState((atual) => (lista.some((u) => u.id === atual) ? atual : lista[0]?.id ?? null));
    } catch (e) {
      avisar(`Não foi possível conectar à API: ${e.message}`, 'erro');
    }
  }, [avisar]);

  useEffect(() => { recarregarUsuarios(); }, [recarregarUsuarios]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  const usuarioAtivo = usuarios.find((u) => u.id === usuarioId) || null;

  return (
    <AppContext.Provider value={{ usuarios, usuarioAtivo, setUsuarioId, recarregarUsuarios, aviso, avisar }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
