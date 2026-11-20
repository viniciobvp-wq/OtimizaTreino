// Camada de acesso à API REST do back-end
const BASE = import.meta.env.VITE_API_URL || '/api';

async function requisicao(metodo, caminho, corpo) {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = dados?.erro || `Erro ${resp.status}`;
    throw new Error(dados?.detalhes?.length ? `${msg}: ${dados.detalhes.join('; ')}` : msg);
  }
  return dados;
}

const qs = (params = {}) => {
  const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return p.toString() ? `?${p}` : '';
};

export const api = {
  listar: (recurso, params) => requisicao('GET', `/${recurso}${qs(params)}`),
  buscar: (recurso, id) => requisicao('GET', `/${recurso}/${id}`),
  criar: (recurso, dados) => requisicao('POST', `/${recurso}`, dados),
  atualizar: (recurso, id, dados) => requisicao('PUT', `/${recurso}/${id}`, dados),
  remover: (recurso, id) => requisicao('DELETE', `/${recurso}/${id}`),
  opcoes: () => requisicao('GET', '/opcoes'),
  otimizacao: (usuarioId) => requisicao('GET', `/usuarios/${usuarioId}/otimizacao`),
  aplicarSugestoes: (treinoId, ajustes) => requisicao('POST', `/treinos/${treinoId}/aplicar-sugestoes`, { ajustes })
};
