import type { ReportOverview } from './types'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export async function getReportOverview(): Promise<ReportOverview> {
  const token = localStorage.getItem('vsr_token')
  const response = await fetch(`${apiUrl}/reports/overview`, { headers: { Authorization: `Bearer ${token ?? ''}` } })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.message ?? `Request failed: ${response.status}`)
  return body as ReportOverview
}
