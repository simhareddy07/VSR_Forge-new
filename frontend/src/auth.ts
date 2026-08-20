export type User = { id: string; name: string; email: string; role: string; avatar: string }
export type AuthResponse = { user: User; token: string }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message ?? `Request failed: ${response.status}`)
  return body as T
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: (token: string) => request<{ user: User }>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
}