// api.js - utilitário para requisições autenticadas e centralizadas

/**
 * Função central de requisição à API com tratamento de token e erros.
 */
async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = options.headers || {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(CONFIG.API_URL + path, { ...options, headers });
  } catch (e) {
    showToast('Erro de conexão com o servidor.', 'erro');
    throw e;
  }
  if (res.status === 401) {
    sessionStorage.removeItem('token');
    window.location.href = 'index.html';
    return;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    showToast(data.error || 'Erro na requisição.', 'erro');
    throw new Error(data.error || 'Erro na requisição');
  }
  return res.json();
}

// Objeto API centralizado por entidade
const api = {
  categorias: {
    listar: () => apiFetch('/categorias'),
    criar: (body) => apiFetch('/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    atualizar: (id, body) => apiFetch(`/categorias/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    excluir: (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' })
  },
  operacoes: {
    listar: (filtros = {}) => {
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFinal) params.append('dataFinal', filtros.dataFinal);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      const queryString = params.toString();
      return apiFetch(`/operacoes${queryString ? '?' + queryString : ''}`);
    },
    criar: (body) => apiFetch('/operacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    atualizar: (id, body) => apiFetch(`/operacoes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    excluir: (id) => apiFetch(`/operacoes/${id}`, { method: 'DELETE' }),
  pagar: (id) => apiFetch(`/operacoes/${id}/pagar`, { method: 'PUT' }),
  estornar: (id) => apiFetch(`/operacoes/${id}/estornar`, { method: 'PUT' })
  },
  despesas: {
    listar: () => apiFetch('/despesas-recorrentes'),
    criar: (body) => apiFetch('/despesas-recorrentes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    excluir: (id) => apiFetch(`/despesas-recorrentes/${id}`, { method: 'DELETE' }),
    parcelas: (id) => apiFetch(`/despesas-recorrentes/${id}/parcelas`),
    obter: (id) => apiFetch(`/despesas-recorrentes/${id}`),
    atualizar: (id, body) => apiFetch(`/despesas-recorrentes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    recriarParcelas: (id) => apiFetch(`/despesas-recorrentes/${id}/recriar-parcelas`, { method: 'POST' })
  },
  dashboard: {
    obter: () => apiFetch('/dashboard')
  }
};
