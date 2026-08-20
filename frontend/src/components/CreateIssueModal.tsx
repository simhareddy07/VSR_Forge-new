import { useEffect, useState } from 'react'
import { projectApi } from '../project-api'
import type { IssueType, Priority, Project } from '../types'

export type CreateIssueInput = { title: string; type: IssueType; priority: Priority; projectId: string; assigneeId: string }

export function CreateIssueModal({ onClose, onCreate }: { onClose: () => void; onCreate: (issue: CreateIssueInput) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<IssueType>('Task')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedProject = projects.find((project) => project.id === projectId)
  const members = selectedProject?.members ?? []

  useEffect(() => { projectApi.getProjects().then((items) => { setProjects(items); setProjectId(items[0]?.id ?? ''); setAssigneeId(items[0]?.members[0]?.id ?? '') }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load projects')).finally(() => setLoadingProjects(false)) }, [])
  const changeProject = (value: string) => { setProjectId(value); setAssigneeId(projects.find((project) => project.id === value)?.members[0]?.id ?? '') }
  const submit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!projectId) { setError('Select a project'); return }
    if (!assigneeId) { setError('Select an assignee'); return }
    setSaving(true); setError('')
    try { await onCreate({ title: title.trim(), type, priority, projectId, assigneeId }); onClose() } catch (createError) { setError(createError instanceof Error ? createError.message : 'Could not create issue') } finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-10 grid place-items-center bg-[#27313b]/30 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#7b8b87]">New work item</span><h2 className="mt-1 font-display text-2xl font-bold">Create issue</h2></div><button onClick={onClose} className="border-0 bg-transparent text-xl text-[#829097]" aria-label="Close">×</button></div><label className="mb-4 block text-xs font-bold text-[#68767c]">Project<select value={projectId} onChange={(event) => changeProject(event.target.value)} disabled={loadingProjects || projects.length === 0} className="mt-2 w-full rounded-md border border-[#e5e8e5] bg-white p-2.5 text-xs font-normal"><option value="">{loadingProjects ? 'Loading projects...' : projects.length ? 'Select a project' : 'No projects available'}</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label className="mb-4 block text-xs font-bold text-[#68767c]">Assignee<select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} disabled={!members.length} className="mt-2 w-full rounded-md border border-[#e5e8e5] bg-white p-2.5 text-xs font-normal"><option value="">{members.length ? 'Select an assignee' : 'No project members available'}</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.role}</option>)}</select></label><label className="mb-4 block text-xs font-bold text-[#68767c]">Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void submit()} className="mt-2 w-full rounded-md border border-[#e5e8e5] p-2.5 text-sm font-normal outline-none focus:border-[#39805f]" placeholder="What needs to be done?" /></label><div className="mb-5 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#68767c]">Type<select value={type} onChange={(event) => setType(event.target.value as IssueType)} className="mt-2 w-full rounded-md border border-[#e5e8e5] bg-white p-2.5 text-xs font-normal"><option>Task</option><option>Bug</option><option>Feature</option></select></label><label className="text-xs font-bold text-[#68767c]">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="mt-2 w-full rounded-md border border-[#e5e8e5] bg-white p-2.5 text-xs font-normal"><option>Medium</option><option>High</option><option>Urgent</option></select></label></div>{error && <p role="alert" className="mb-4 rounded-md bg-[#fff0ec] p-3 text-xs font-semibold text-[#b34f42]">{error}</p>}<div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-[#dce3df] bg-white px-4 py-2 text-xs font-bold text-[#68767c]">Cancel</button><button onClick={() => void submit()} disabled={saving || loadingProjects || !title.trim() || !projectId || !assigneeId} className="rounded-md bg-[#286f50] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Creating...' : 'Create issue'}</button></div></div></div>
}
