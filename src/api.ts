import type { Issue, IssueType, Priority } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.status === 204 ? (undefined as T) : response.json()
}

export const issueApi = {
  list: () => request<Issue[]>('/issues'),
  create: (input: { title: string; type: IssueType; priority: Priority }) => request<Issue>('/issues', { method: 'POST', body: JSON.stringify(input) }),
  updateStatus: (id: string, status: string) => request<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  archive: (id: string) => request<void>(`/issues/${id}`, { method: 'DELETE' }),
}