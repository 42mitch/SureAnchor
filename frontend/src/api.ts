// In development, Vite proxies /api/* → http://localhost:5022
// In production, set VITE_API_URL to the backend base URL in Azure SWA app settings
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
}
