import type { ProjectStats } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export type DashboardStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  completedIssues: number
  openBugs: number
  overdueIssues: number
  activeProject: ProjectStats | null
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}/dashboard/stats`, { headers: { Authorization: `Bearer ${token ?? ''}` } })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
  return body as DashboardStats
}
