import { useEffect } from 'react';

export function Modal({ titulo, aberto, onFechar, children, largo = false }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const esc = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`modal ${largo ? 'modal-largo' : ''}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="modal-topo">
          <h2>{titulo}</h2>
          <button type="button" className="btn-icone" onClick={onFechar} aria-label="Fechar">×</button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Campo({ rotulo, children, largura }) {
  return (
    <label className="campo" style={largura ? { gridColumn: `span ${largura}` } : undefined}>
      <span>{rotulo}</span>
      {children}
    </label>
  );
}

export function Vazio({ children }) {
  return <div className="vazio">{children}</div>;
}
