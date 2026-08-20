import type { Comment, Issue, IssueType, Priority } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...options })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `API request failed: ${response.status}`)
  return response.status === 204 ? (undefined as T) : body as T
}

export const issueApi = {
  list: (projectId?: string) => request<Issue[]>(projectId ? `/issues?projectId=${encodeURIComponent(projectId)}` : '/issues'),
  create: (input: { title: string; type: IssueType; priority: Priority; projectId: string; assigneeId: string }) => request<Issue>('/issues', { method: 'POST', body: JSON.stringify(input) }),
  updateStatus: (id: string, status: string, assigneeId?: string) => request<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ...(assigneeId ? { assigneeId } : {}) }) }),
  archive: (id: string) => request<void>(`/issues/${id}`, { method: 'DELETE' }),
  listComments: (issueId: string) => request<Comment[]>(`/issues/${encodeURIComponent(issueId)}/comments`),
  createComment: (issueId: string, content: string) => request<Comment>(`/issues/${encodeURIComponent(issueId)}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  updateComment: (id: string, content: string) => request<Comment>(`/comments/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteComment: (id: string) => request<void>(`/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}