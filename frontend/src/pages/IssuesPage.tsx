import type { Issue } from '../types'
import { ActivityPanel } from '../components/ActivityPanel'
import { IssueBoard } from '../components/IssueBoard'
export function IssuesPage({ issues, onOpenIssue, onArchiveIssue, onCreateIssue }: { issues: Issue[]; onOpenIssue: (issue: Issue) => void; onArchiveIssue: (issue: Issue) => void; onCreateIssue: () => void }) { return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_285px]"><IssueBoard issues={issues} onOpenIssue={onOpenIssue} onArchiveIssue={onArchiveIssue} onCreateIssue={onCreateIssue} /><ActivityPanel /></div> }
