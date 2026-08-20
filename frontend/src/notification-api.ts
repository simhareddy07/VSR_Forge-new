import type { AppNotification } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string, options?: RequestInit) {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` }, ...options })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
  return body as T
}

export const notificationApi = {
  list: () => request<AppNotification[]>('/notifications'),
  markRead: (id: string) => request<{ id: string; read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllRead: () => request<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),
  remove: (id: string) => request<void>(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}