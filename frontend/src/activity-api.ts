import type { Activity } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export const activityApi = {
  list: async (filters?: { projectId?: string; issueId?: string; entityType?: string; entityId?: string }) => {
    const query = new URLSearchParams()
    Object.entries(filters ?? {}).forEach(([key, value]) => { if (value) query.set(key, value) })
    const token = localStorage.getItem('vsr_token')
    const response = await fetch(`${apiUrl}/activity${query.size ? `?${query.toString()}` : ''}`, { headers: { Authorization: `Bearer ${token ?? ''}` } })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
    return body as Activity[]
  },
}