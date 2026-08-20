import type { Project, ProjectStatus } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export type ProjectInput = { name: string; description: string; status: ProjectStatus; members?: string[]; startDate?: string; deadline?: string }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
  return body as T
}

export const projectApi = {
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (data: ProjectInput) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<ProjectInput>) => request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id: string, userId: string) => request<Project>(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (id: string, userId: string) => request<Project>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
}