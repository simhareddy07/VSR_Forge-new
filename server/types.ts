export type IssueType = 'Bug' | 'Feature' | 'Task'
export type Priority = 'Urgent' | 'High' | 'Medium'
export type Issue = { id: string; title: string; type: IssueType; priority: Priority; status: string; assignee: string; initials: string; tone: string }