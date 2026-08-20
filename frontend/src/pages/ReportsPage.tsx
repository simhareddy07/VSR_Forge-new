import { useEffect, useState } from 'react'
import { Check, CircleDot, Clock3, FolderKanban, TriangleAlert } from 'lucide-react'
import { getReportOverview } from '../reports-api'
import type { ReportOverview } from '../types'
import { MetricCard } from '../components/MetricCard'
import { PanelTitle } from '../components/Typography'

const statusLabels = ['Todo', 'In progress', 'Code review', 'Testing', 'Done']
const priorityLabels = ['Urgent', 'High', 'Medium']

function BarList({ values, labels, tone }: { values: Record<string, number>; labels: string[]; tone: string }) {
  const maximum = Math.max(...labels.map((label) => values[label] ?? 0), 1)
  return <div className="grid gap-3">{labels.map((label) => <div key={label}><div className="mb-1 flex justify-between text-[10px] text-[#68767c]"><span>{label}</span><strong>{values[label] ?? 0}</strong></div><div className="h-2 rounded bg-[#edf1ee]"><i className={`block h-full rounded ${tone}`} style={{ width: `${((values[label] ?? 0) / maximum) * 100}%` }} /></div></div>)}</div>
}

function ReportSkeleton() { return <div className="grid gap-4 lg:grid-cols-2"><div className="h-56 animate-pulse rounded-[9px] bg-[#eaf0eb]" /><div className="h-56 animate-pulse rounded-[9px] bg-[#eaf0eb]" /><div className="h-56 animate-pulse rounded-[9px] bg-[#eaf0eb]" /><div className="h-56 animate-pulse rounded-[9px] bg-[#eaf0eb]" /></div> }

export function ReportsPage() {
  const [report, setReport] = useState<ReportOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { getReportOverview().then(setReport).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load reports')).finally(() => setLoading(false)) }, [])
  if (loading) return <ReportSkeleton />
  if (error) return <div role="alert" className="rounded-md bg-[#fff0ec] p-5 text-xs text-[#b34f42]">{error}</div>
  if (!report) return <div className="rounded-md bg-[#f5f7f5] p-5 text-xs text-[#76838a]">No report data is available yet.</div>
  const hasData = report.projects.total > 0 || report.issues.total > 0
  if (!hasData) return <div className="rounded-[9px] border border-dashed border-[#cbded1] bg-[#f7fbf8] p-8 text-center"><h2 className="font-display text-xl font-bold">No report data yet</h2><p className="mt-1 text-xs text-[#8a969c]">Create projects and issues to see analytics here.</p></div>
  return <div className="grid gap-4"><section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"><MetricCard icon={<FolderKanban />} label="Total projects" value={`${report.projects.total}`} detail={`${report.projects.active} active`} positive /><MetricCard icon={<CircleDot />} label="Active projects" value={`${report.projects.active}`} detail="Currently active" /><MetricCard icon={<Check />} label="Completed projects" value={`${report.projects.completed}`} detail="Finished projects" positive /><MetricCard icon={<TriangleAlert />} label="Overdue issues" value={`${report.issues.overdue}`} detail="Past project deadline" /></section><section className="grid gap-4 lg:grid-cols-2"><div className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Issue summary" title="Issue mix" /><div className="grid grid-cols-2 gap-3"><MetricCard icon={<CircleDot />} label="Total issues" value={`${report.issues.total}`} detail="Across projects" positive /><MetricCard icon={<TriangleAlert />} label="Bugs" value={`${report.issues.bugs}`} detail={`${report.issues.tasks} tasks · ${report.issues.features} features`} /><MetricCard icon={<Clock3 />} label="In progress" value={`${report.issues.inProgress}`} detail={`${report.issues.todo} todo`} /><MetricCard icon={<Check />} label="Completed" value={`${report.issues.completed}`} detail="Done issues" positive /></div></div><div className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Priorities" title="Issues by priority" /><BarList values={report.byPriority} labels={priorityLabels} tone="bg-[#72a98a]" /></div><div className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Workflow" title="Issues by status" /><BarList values={report.byStatus} labels={statusLabels} tone="bg-[#7f9bb7]" /></div><div className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Delivery health" title="Project progress" /><div className="grid gap-4">{report.projectProgress.map((project) => <div key={project.id}><div className="mb-1 flex justify-between text-[10px] text-[#68767c]"><span className="font-bold">{project.name}</span><span>{project.progress}% · {project.completedIssues}/{project.totalIssues}</span></div><div className="h-2 rounded bg-[#d5e6dc]"><i className="block h-full rounded bg-[#358860]" style={{ width: `${project.progress}%` }} /></div></div>)}</div></div></section><section className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Workload" title="Team workload" />{report.teamWorkload.length === 0 ? <p className="rounded-md bg-[#f5f7f5] p-4 text-xs text-[#76838a]">No assigned issues yet.</p> : <div className="grid gap-4 sm:grid-cols-2">{report.teamWorkload.map((member) => <div key={member.userId ?? member.name}><div className="mb-1 flex justify-between text-[11px]"><strong>{member.name}</strong><span>{member.total} issues</span></div><div className="h-2 rounded bg-[#edf1ee]"><i className="block h-full rounded bg-[#5a9b79]" style={{ width: `${Math.min(member.total / Math.max(...report.teamWorkload.map((item) => item.total), 1) * 100, 100)}%` }} /></div><p className="mt-1 text-[10px] text-[#97a1a5]">{member.open} open · {member.completed} completed</p></div>)}</div>}</section></div>
}
