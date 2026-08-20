import type { ProjectUser } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string): Promise<T> {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${token ?? ''}` } })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
  return body as T
}

export const userApi = { getUsers: () => request<ProjectUser[]>('/users') }