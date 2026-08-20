import type { Issue, Project } from '../types'
import { ActivityPanel } from '../components/ActivityPanel'
import { IssueBoard } from '../components/IssueBoard'
export function IssuesPage({ issues, projects, onOpenIssue, onArchiveIssue, onCreateIssue }: { issues: Issue[]; projects: Project[]; onOpenIssue: (issue: Issue) => void; onArchiveIssue: (issue: Issue) => void; onCreateIssue: () => void }) { return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_285px]"><IssueBoard issues={issues} projects={projects} onOpenIssue={onOpenIssue} onArchiveIssue={onArchiveIssue} onCreateIssue={onCreateIssue} /><ActivityPanel /></div> }
