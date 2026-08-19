import type { Issue, PageName } from './types'

export const issues: Issue[] = [
  { id: 'BUG-101', title: 'Login button not working on mobile', type: 'Bug', priority: 'Urgent', status: 'In progress', assignee: 'Rahul K.', initials: 'RK', tone: 'coral' },
  { id: 'FEAT-104', title: 'Add dark mode to workspace', type: 'Feature', priority: 'Medium', status: 'Todo', assignee: 'Priya S.', initials: 'PS', tone: 'violet' },
  { id: 'TASK-103', title: 'Create product search component', type: 'Task', priority: 'High', status: 'Code review', assignee: 'Vijay R.', initials: 'VR', tone: 'blue' },
  { id: 'BUG-102', title: 'Payment API returns a 502 error', type: 'Bug', priority: 'High', status: 'Testing', assignee: 'Ananya M.', initials: 'AM', tone: 'amber' },
  { id: 'TASK-098', title: 'Update onboarding documentation', type: 'Task', priority: 'Medium', status: 'Done', assignee: 'Kiran P.', initials: 'KP', tone: 'mint' },
]

export const columns = ['Todo', 'In progress', 'Code review', 'Testing', 'Done']
export const pageCopy: Record<Exclude<PageName, 'Overview'>, [string, string, string]> = {
  Projects: ['Portfolio view', 'Projects', 'Keep every product, deadline, and delivery milestone in view.'],
  Issues: ['Work queue', 'Issues', 'Search, triage, and prioritize the work your team needs next.'],
  Team: ['People directory', 'Team', 'See ownership, workload, and availability across the engineering team.'],
  Activity: ['Project history', 'Activity', 'A clear timeline of the changes happening across your workspace.'],
  Reports: ['Performance insights', 'Reports', 'Understand delivery pace, issue trends, and project health.'],
  Settings: ['Workspace controls', 'Settings', 'Shape your workspace, notifications, and project preferences.'],
}
