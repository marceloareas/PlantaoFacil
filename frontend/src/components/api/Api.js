import React from "react";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const ApiServer = () => API_URL.replace(/\/api\/v\d+\/?$/, '');
const getToken = () => localStorage.getItem('token');

const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (window.location.pathname !== '/'){
        window.location.href = '/';
    }
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    handleUnauthorized();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    let detail = data?.detail || `Erro ${res.status}`;
    if (Array.isArray(detail)) {
      detail = detail.map(e => e.msg || e).join(', ');
    }
    const err = new Error(detail);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put:    (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
};

export default ApiServer;
export { api, API_URL};