import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { columns } from '../data'
import type { Issue, Project } from '../types'
import { PanelTitle } from './Typography'
import { IssueCard } from './IssueCard'

type Filters = { project: string; status: string; priority: string; type: string; assignee: string }

export function IssueBoard({ issues, projects = [], searchable = true, onOpenIssue, onArchiveIssue, onCreateIssue, onViewIssues }: { issues: Issue[]; projects?: Project[]; searchable?: boolean; onOpenIssue: (issue: Issue) => void; onArchiveIssue: (issue: Issue) => void; onCreateIssue?: () => void; onViewIssues?: () => void }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({ project: '', status: '', priority: '', type: '', assignee: '' })
  const visible = issues.filter((issue) => `${issue.id} ${issue.title} ${issue.assignee} ${issue.projectName ?? ''}`.toLowerCase().includes(query.toLowerCase()) && (!filters.project || issue.projectId === filters.project) && (!filters.status || issue.status === filters.status) && (!filters.priority || issue.priority === filters.priority) && (!filters.type || issue.type === filters.type) && (!filters.assignee || issue.assignee === filters.assignee))
  const updateFilter = (field: keyof Filters, value: string) => setFilters((current) => ({ ...current, [field]: value }))
  const clearFilters = () => { setQuery(''); setFilters({ project: '', status: '', priority: '', type: '', assignee: '' }) }
  const assignees = [...new Set(issues.map((issue) => issue.assignee))]
  return <section className="rounded-[9px] border border-[#e5e8e5] bg-white p-4 sm:p-5">
    <div className="mb-5 flex items-center justify-between"><PanelTitle eyebrow="Team workload" title="Issue board" action={searchable ? 'Clear filters' : onViewIssues ? 'View all issues →' : undefined} onAction={searchable ? clearFilters : onViewIssues} />{onCreateIssue && <button onClick={onCreateIssue} className="flex items-center gap-1 rounded-md bg-[#286f50] px-2.5 py-1.5 text-[10px] font-bold text-white"><Plus size={13} /> New</button>}</div>
    {searchable && <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex h-9 items-center gap-2 rounded-md border border-[#e5e8e5] px-2.5 text-[#9ca7ab] sm:col-span-2 lg:col-span-1"><Search size={17} /><input className="w-full border-0 text-[11px] outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues..." /></label>
      <select aria-label="Filter by project" className="h-9 rounded-md border border-[#e5e8e5] bg-white px-2 text-[11px] text-[#66747a]" value={filters.project} onChange={(event) => updateFilter('project', event.target.value)}><option value="">All projects</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
      <select aria-label="Filter by status" className="h-9 rounded-md border border-[#e5e8e5] bg-white px-2 text-[11px] text-[#66747a]" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option>{columns.map((column) => <option key={column}>{column}</option>)}</select>
      <select aria-label="Filter by priority" className="h-9 rounded-md border border-[#e5e8e5] bg-white px-2 text-[11px] text-[#66747a]" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}><option value="">All priorities</option><option>Urgent</option><option>High</option><option>Medium</option></select>
      <select aria-label="Filter by type" className="h-9 rounded-md border border-[#e5e8e5] bg-white px-2 text-[11px] text-[#66747a]" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}><option value="">All types</option><option>Bug</option><option>Feature</option><option>Task</option></select>
      <select aria-label="Filter by assignee" className="h-9 rounded-md border border-[#e5e8e5] bg-white px-2 text-[11px] text-[#66747a]" value={filters.assignee} onChange={(event) => updateFilter('assignee', event.target.value)}><option value="">All assignees</option>{assignees.map((assignee) => <option key={assignee}>{assignee}</option>)}</select>
    </div>}
    {visible.length === 0 && <p className="rounded-md bg-[#f5f7f5] p-4 text-xs text-[#76838a]">No matching issues. Try another search.</p>}
    <div className="grid grid-cols-5 gap-2.5 overflow-x-auto pb-1">{columns.map((column) => <div className="min-w-[130px]" key={column}><div className="mb-3 flex items-center gap-1.5 text-[10px] text-[#65737b]"><i className={`h-2 w-2 rounded-full ${column === 'In progress' ? 'bg-[#e79b5a]' : column === 'Code review' ? 'bg-[#8098bd]' : column === 'Testing' ? 'bg-[#b596cf]' : column === 'Done' ? 'bg-[#59a77d]' : 'bg-[#c8cfd1]'}`} /><strong>{column}</strong><span className="ml-auto text-[#aeb6b9]">{visible.filter((issue) => issue.status === column).length}</span></div>{visible.filter((issue) => issue.status === column).map((issue) => <IssueCard issue={issue} onOpen={() => onOpenIssue(issue)} onArchive={() => onArchiveIssue(issue)} key={issue.id} />)}{column === 'Todo' && onCreateIssue && <button onClick={onCreateIssue} className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-[#bfd8c8] py-3 text-[10px] font-bold text-[#39805f]"><Plus size={13} /> Add issue</button>}</div>)}</div>
  </section>
}
