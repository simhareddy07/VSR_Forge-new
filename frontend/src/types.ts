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

export type PageName = 'Overview' | 'Projects' | 'Issues' | 'Team' | 'Activity' | 'Reports' | 'Settings'
