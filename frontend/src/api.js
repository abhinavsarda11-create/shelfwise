const TOKEN = 'shelfwise_token';
const USER = 'shelfwise_user';

export const session = {
  token: () => localStorage.getItem(TOKEN),
  user: () => JSON.parse(localStorage.getItem(USER) || 'null'),
  set: (token, user) => {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  },
};

async function request(path, options = {}) {
  const token = session.token();
  const res = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !path.startsWith('/auth')) {
    session.clear();
    window.dispatchEvent(new Event('signed-out'));
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
