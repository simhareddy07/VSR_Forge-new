export type IssueType = 'Bug' | 'Feature' | 'Task'
export type Priority = 'Urgent' | 'High' | 'Medium'
export type ProjectStatus = 'Planning' | 'Active' | 'On hold' | 'Completed' | 'Archived'

export type Issue = {
  id: string
  title: string
  type: IssueType
  priority: Priority
  status: string
  assignee: string
  assigneeId?: string
  initials: string
  tone: string
  projectId?: string
  projectName?: string
}

export type Comment = { id: string; content: string; author: ProjectUser; createdAt?: string; updatedAt?: string }
export type Activity = { id: string; action: string; entityType: 'Project' | 'Issue' | 'Comment'; entityId: string; projectId?: string; issueId?: string; metadata?: Record<string, unknown>; actor: ProjectUser; createdAt?: string }
export type AppNotification = { id: string; type: 'assignment' | 'status_change' | 'comment' | 'project_member' | 'deadline'; title: string; message: string; read: boolean; relatedProject?: { id: string; name: string }; relatedIssue?: { id: string; issueNumber?: string; title?: string }; createdAt?: string }

export type ProjectUser = { id: string; name: string; email: string; role: string; avatar: string }

export type Project = {
  id: string
  name: string
  description: string
  owner: ProjectUser
  members: ProjectUser[]
  status: ProjectStatus
  startDate: string | null
  deadline: string | null
  createdAt?: string
  updatedAt?: string
}

export type ProjectStats = { id: string; name: string; description: string; memberCount: number; deadline: string | null; progress: number }
export type ReportOverview = { projects: { total: number; active: number; completed: number }; issues: { total: number; bugs: number; tasks: number; features: number; completed: number; inProgress: number; todo: number; overdue: number }; byPriority: Record<string, number>; byStatus: Record<string, number>; projectProgress: Array<{ id: string; name: string; status: ProjectStatus; totalIssues: number; completedIssues: number; progress: number }>; teamWorkload: Array<{ userId?: string; name: string; total: number; completed: number; open: number }> }

export type PageName = 'Overview' | 'Projects' | 'Issues' | 'Team' | 'Activity' | 'Reports' | 'Settings'
