import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { issues as seedIssues, pageCopy } from './data'
import type { Issue, PageName } from './types'
import type { Project } from './types'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { CreateIssueModal } from './components/CreateIssueModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { Eyebrow } from './components/Typography'
import { OverviewPage } from './pages/OverviewPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { TeamPage } from './pages/TeamPage'
import { ActivityPage } from './pages/ActivityPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { issueApi } from './api'
import { projectApi } from './project-api'
import { getDashboardStats } from './dashboard-api'
import type { DashboardStats } from './dashboard-api'
import { authApi } from './auth'
import type { AuthResponse, User } from './auth'
import { AuthPage } from './components/AuthPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [page, setPage] = useState<PageName>('Overview')
  const [profileOpen, setProfileOpen] = useState(false)
  const [issues, setIssues] = useState<Issue[]>(seedIssues)
  const [projects, setProjects] = useState<Project[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(true)
  const [dashboardStatsError, setDashboardStatsError] = useState('')
  const [modal, setModal] = useState<'create' | 'detail' | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [toast, setToast] = useState('')
  const copy = page === 'Overview' ? null : pageCopy[page]
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  useEffect(() => { const token = localStorage.getItem('vsr_token'); if (!token) { setCheckingAuth(false); return }; authApi.me(token).then(({ user: currentUser }) => setUser(currentUser)).catch(() => localStorage.removeItem('vsr_token')).finally(() => setCheckingAuth(false)) }, [])
  useEffect(() => { if (user) issueApi.list().then(setIssues).catch(() => notify('API unavailable; using local issue data')) }, [user])
  useEffect(() => { if (user) projectApi.getProjects().then(setProjects).catch(() => undefined) }, [user])
  useEffect(() => { if (!user) return; setDashboardStatsLoading(true); setDashboardStatsError(''); getDashboardStats().then(setDashboardStats).catch((loadError) => setDashboardStatsError(loadError instanceof Error ? loadError.message : 'Could not load dashboard statistics')).finally(() => setDashboardStatsLoading(false)) }, [user])
  if (checkingAuth) return <div className="flex min-h-screen items-center justify-center bg-[#eef3ef] text-sm font-semibold text-[#286f50]">Loading your workspace...</div>
  if (!user) return <AuthPage onAuthenticated={({ user: authenticatedUser, token }: AuthResponse) => { localStorage.setItem('vsr_token', token); setUser(authenticatedUser) }} />
  const openIssue = (issue: Issue) => { setSelectedIssue(issue); setModal('detail') }
  const updateIssue = async (status: string, assigneeId?: string) => { if (!selectedIssue) return; try { const updated = await issueApi.updateStatus(selectedIssue.id, status, assigneeId); setIssues((current) => current.map((issue) => issue.id === updated.id ? updated : issue)); setSelectedIssue(updated); notify(`${updated.id} updated`) } catch { notify('Could not sync issue update') } }
  const archiveIssue = async (issue: Issue) => { try { await issueApi.archive(issue.id) } catch { notify('Could not sync archive; removed locally') } setIssues((current) => current.filter((item) => item.id !== issue.id)); notify(`${issue.id} archived`) }
  const createIssue = async (input: { title: string; type: Issue['type']; priority: Issue['priority']; projectId: string; assigneeId: string }) => { const created = await issueApi.create(input); setIssues((current) => [created, ...current]); notify(`${created.id} created`) }
  const navigateToIssues = () => setPage('Issues')
  const renderPage = () => {
    if (profileOpen) return <ProfilePage user={user} onSaved={(updatedUser) => { setUser(updatedUser); notify('Profile updated') }} />
    if (page === 'Overview') return <OverviewPage issues={issues} projects={projects} stats={dashboardStats} statsLoading={dashboardStatsLoading} statsError={dashboardStatsError} onOpenIssue={openIssue} onArchiveIssue={archiveIssue} onCreateIssue={() => setModal('create')} onViewIssues={navigateToIssues} />
    if (page === 'Projects') return <ProjectsPage />
    if (page === 'Issues') return <IssuesPage issues={issues} projects={projects} onOpenIssue={openIssue} onArchiveIssue={archiveIssue} onCreateIssue={() => setModal('create')} />
    if (page === 'Team') return <TeamPage onInvite={() => notify('Invite link copied')} />
    if (page === 'Activity') return <ActivityPage />
    if (page === 'Reports') return <ReportsPage />
    return <SettingsPage onSaved={() => notify('Settings saved')} />
  }
  return <div className="flex min-h-screen bg-[#f5f7f5] font-sans text-[#27313b]"><Sidebar page={page} onNavigate={(nextPage) => { setProfileOpen(false); setPage(nextPage) }} onFeedback={() => notify('Feedback form is coming soon')} /><main className="min-w-0 flex-1"><Topbar onProfile={() => setProfileOpen(true)} onLogout={() => { localStorage.removeItem('vsr_token'); setUser(null) }} user={user} /><div className="mx-auto max-w-[1500px] px-5 pb-14 pt-8 sm:px-10 lg:px-14"><div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end"><div><Eyebrow>{profileOpen ? 'Account' : page === 'Overview' ? 'Project overview' : copy?.[0]}</Eyebrow><h1 className="mt-2 font-display text-3xl font-bold text-[#24323a]">{profileOpen ? 'Your profile' : page === 'Overview' ? `Good morning, ${user.name.split(' ')[0]}` : copy?.[1]}</h1><p className="mt-1 text-sm text-[#8a969c]">{profileOpen ? 'Manage your personal details and account information.' : page === 'Overview' ? 'Here’s what’s happening with your team today.' : copy?.[2]}</p></div>{!profileOpen && <button onClick={() => setModal('create')} className="flex items-center gap-2 rounded-md bg-[#286f50] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1c6042]"><Plus size={17} /> Create issue</button>}</div>{renderPage()}</div></main>{modal === 'create' && <CreateIssueModal onClose={() => setModal(null)} onCreate={createIssue} />}{modal === 'detail' && selectedIssue && <IssueDetailModal issue={selectedIssue} user={user} onClose={() => { setModal(null); setSelectedIssue(null) }} onStatusChange={updateIssue} />}{toast && <div role="status" className="fixed bottom-5 right-5 z-20 rounded-lg bg-[#27313b] px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>}</div>
}

export default App
