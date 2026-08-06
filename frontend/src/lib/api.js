const BASE = import.meta.env.VITE_API_URL || '/api';

export const tokenStore = {
  key: 'sn_token_app',
  get() { return localStorage.getItem(this.key); },
  set(token) { localStorage.setItem(this.key, token); },
  clear() { localStorage.removeItem(this.key); },
  useScope(scope) { this.key = scope === 'admin' ? 'sn_token_admin' : 'sn_token_app'; },
};

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    const err = new Error(data?.error || `So'rov bajarilmadi (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fileUrl = (id) => `${BASE}/files/${id}`;

/** Fayllarni token bilan yuklab olish (Authorization sarlavhasi kerak) */
export async function downloadFile(attachment) {
  const res = await fetch(fileUrl(attachment.id), { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) throw new Error('Faylni yuklab bolmadi');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = attachment.original_name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Eksport (Excel va h.k.) endpointlarini token bilan yuklab, faylga saqlaydi. */
export async function downloadBlob(path, filename) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : null;
    throw new Error(data?.error || `Eksport bajarilmadi (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
