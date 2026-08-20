import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { IssueModel } from './issue-model.js'
import { IssueNumberModel } from './issue-number-model.js'
import { CommentModel } from './comment-model.js'
import { ActivityModel } from './activity-model.js'
import { NotificationModel } from './notification-model.js'
import { ProjectModel } from './project-model.js'
import { UserModel } from './user-model.js'
import type { Issue, IssueType, Priority } from './types.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const mongoUri = process.env.MONGODB_URI
const jwtSecret = process.env.JWT_SECRET ?? 'vsr-forge-development-secret'
type User = { id: string; name: string; email: string; passwordHash: string; role: string; avatar: string }
let memoryUsers: User[] = []
let memoryIssues: Issue[] = [
  { id: 'BUG-101', title: 'Login button not working on mobile', type: 'Bug', priority: 'Urgent', status: 'In progress', assignee: 'Rahul K.', initials: 'RK', tone: 'coral' },
  { id: 'FEAT-104', title: 'Add dark mode to workspace', type: 'Feature', priority: 'Medium', status: 'Todo', assignee: 'Priya S.', initials: 'PS', tone: 'violet' },
  { id: 'TASK-103', title: 'Create product search component', type: 'Task', priority: 'High', status: 'Code review', assignee: 'Vijay R.', initials: 'VR', tone: 'blue' },
  { id: 'BUG-102', title: 'Payment API returns a 502 error', type: 'Bug', priority: 'High', status: 'Testing', assignee: 'Ananya M.', initials: 'AM', tone: 'amber' },
  { id: 'TASK-098', title: 'Update onboarding documentation', type: 'Task', priority: 'Medium', status: 'Done', assignee: 'Kiran P.', initials: 'KP', tone: 'mint' },
]

const configuredOrigins = new Set((process.env.CLIENT_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean))
app.use(cors({ origin: (origin, callback) => {
  const isLocalViteOrigin = Boolean(origin && /^http:\/\/localhost:\d+$/.test(origin))
  if (!origin || configuredOrigins.has(origin) || isLocalViteOrigin) return callback(null, true)
  return callback(new Error('Origin is not allowed by CORS'))
} }))
app.use(express.json())

const isMongo = () => mongoose.connection.readyState === 1
const publicUser = (user: User) => ({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar })
const publicDirectoryUser = (user: { _id?: mongoose.Types.ObjectId | string; id?: string; name: string; email: string; role?: string; avatar?: string }) => ({ id: user._id?.toString() ?? user.id ?? '', name: user.name, email: user.email, role: user.role ?? 'Member', avatar: user.avatar ?? '' })
const createToken = (user: User) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' })
const auth = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return response.status(401).json({ message: 'Authentication required' })
  try {
    const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload
    const user = isMongo() ? await UserModel.findOne({ id: payload.sub }).lean() : memoryUsers.find((item) => item.id === payload.sub)
    if (!user) return response.status(401).json({ message: 'User not found' })
    response.locals.user = user
    return next()
  } catch { return response.status(401).json({ message: 'Invalid or expired token' }) }
}

app.get('/api/health', (_request, response) => response.json({ ok: true, database: isMongo() ? 'mongodb' : 'memory' }))

app.post('/api/auth/register', async (request, response) => {
  const { name, email, password } = request.body as { name?: string; email?: string; password?: string }
  if (!name?.trim() || !email?.trim() || !password) return response.status(400).json({ message: 'Name, email, and password are required' })
  if (password.length < 8) return response.status(400).json({ message: 'Password must be at least 8 characters' })
  const normalizedEmail = email.trim().toLowerCase()
  const existing = isMongo() ? await UserModel.findOne({ email: normalizedEmail }) : memoryUsers.find((item) => item.email === normalizedEmail)
  if (existing) return response.status(409).json({ message: 'An account with that email already exists' })
  const user = { id: new mongoose.Types.ObjectId().toString(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role: 'Member', avatar: '' }
  if (isMongo()) await UserModel.create(user)
  else memoryUsers.push(user)
  return response.status(201).json({ user: publicUser(user), token: createToken(user) })
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body as { email?: string; password?: string }
  if (!email?.trim() || !password) return response.status(400).json({ message: 'Email and password are required' })
  const user = isMongo() ? await UserModel.findOne({ email: email.trim().toLowerCase() }).lean() : memoryUsers.find((item) => item.email === email.trim().toLowerCase())
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return response.status(401).json({ message: 'Invalid email or password' })
  return response.json({ user: publicUser(user), token: createToken(user) })
})

app.get('/api/auth/debug-users', async (_request, response) => {
  if (process.env.NODE_ENV === 'production') return response.status(404).json({ message: 'Not found' })
  const users = isMongo() ? await UserModel.find().select('id name email role createdAt passwordHash').lean() : memoryUsers
  return response.json({ users: users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, hasPasswordHash: Boolean(user.passwordHash), passwordHashAlgorithm: user.passwordHash?.startsWith('$2') ? 'bcrypt' : 'unknown' })) })
})

app.get('/api/auth/me', auth, (_request, response) => response.json({ user: publicUser(response.locals.user as User) }))

app.get('/api/users', auth, async (_request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'User directory requires an active MongoDB connection' })
  const users = await UserModel.find().select('_id name email role avatar').sort({ name: 1 }).lean()
  return response.json(users.map(publicDirectoryUser))
})

app.get('/api/dashboard/stats', auth, async (_request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Dashboard statistics require an active MongoDB connection' })
  try {
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const projects = await ProjectModel.find(projectAccess(userId)).select('_id name description members status deadline').lean()
    const projectIds = projects.map((project) => project._id)
    const activeProjects = projects.filter((project) => project.status === 'Active').length
    const completedProjects = projects.filter((project) => project.status === 'Completed').length
    const issueStats = projectIds.length ? (await IssueModel.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $lookup: { from: 'projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      { $group: { _id: null, totalIssues: { $sum: 1 }, completedIssues: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } }, inProgressIssues: { $sum: { $cond: [{ $eq: ['$status', 'In progress'] }, 1, 0] } }, openBugs: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'Bug'] }, { $ne: ['$status', 'Done'] }] }, 1, 0] } }, overdueIssues: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'Done'] }, { $lt: ['$project.deadline', new Date()] }] }, 1, 0] } } } },
    ]))[0] : undefined
    const totalIssues = issueStats?.totalIssues ?? 0
    const completedIssues = issueStats?.completedIssues ?? 0
    const activeProject = projects.find((project) => project.status === 'Active') ?? projects[0]
    const activeProjectIssues = activeProject ? await IssueModel.countDocuments({ projectId: activeProject._id }) : 0
    const activeProjectCompletedIssues = activeProject ? await IssueModel.countDocuments({ projectId: activeProject._id, status: 'Done' }) : 0
    return response.json({
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalIssues,
      openIssues: totalIssues - completedIssues,
      inProgressIssues: issueStats?.inProgressIssues ?? 0,
      completedIssues,
      openBugs: issueStats?.openBugs ?? 0,
      overdueIssues: issueStats?.overdueIssues ?? 0,
      activeProject: activeProject ? { id: activeProject._id.toString(), name: activeProject.name, description: activeProject.description, memberCount: activeProject.members.length, deadline: activeProject.deadline ?? null, progress: activeProjectIssues ? Math.round((activeProjectCompletedIssues / activeProjectIssues) * 100) : 0 } : null,
    })
  } catch (error) {
    return response.status(500).json({ message: error instanceof Error ? error.message : 'Could not load dashboard statistics' })
  }
})

app.get('/api/reports/overview', auth, async (_request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Reports require an active MongoDB connection' })
  try {
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const projects = await ProjectModel.find(projectAccess(userId)).select('_id name status deadline members').lean()
    const projectIds = projects.map((project) => project._id)
    const issues = projectIds.length ? await IssueModel.find({ projectId: { $in: projectIds } }).select('issueNumber type priority status assignee assigneeId projectId').populate('assigneeId', 'name').lean() : []
    const now = new Date()
    const byType = { Bug: 0, Task: 0, Feature: 0 }
    const byPriority = { Urgent: 0, High: 0, Medium: 0 }
    const byStatus: Record<string, number> = { Todo: 0, 'In progress': 0, 'Code review': 0, Testing: 0, Done: 0 }
    const projectDeadlines = new Map(projects.map((project) => [project._id.toString(), project.deadline]))
    const workload = new Map<string, { userId?: string; name: string; total: number; completed: number; open: number }>()
    let overdueIssues = 0
    for (const issue of issues) {
      byType[issue.type] += 1
      byPriority[issue.priority] += 1
      byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1
      const issueProjectId = issue.projectId?.toString() ?? ''
      const deadline = projectDeadlines.get(issueProjectId)
      if (issue.status !== 'Done' && deadline && deadline < now) overdueIssues += 1
      const assignee = issue.assigneeId && typeof issue.assigneeId === 'object' && 'name' in issue.assigneeId ? issue.assigneeId as unknown as { _id?: mongoose.Types.ObjectId; name?: string } : undefined
      const key = assignee?._id?.toString() ?? issue.assignee ?? 'Unassigned'
      const current = workload.get(key) ?? { userId: assignee?._id?.toString(), name: assignee?.name ?? issue.assignee ?? 'Unassigned', total: 0, completed: 0, open: 0 }
      current.total += 1
      if (issue.status === 'Done') current.completed += 1
      else current.open += 1
      workload.set(key, current)
    }
    const projectProgress = projects.map((project) => {
      const projectIssues = issues.filter((issue) => issue.projectId?.toString() === project._id.toString())
      const completed = projectIssues.filter((issue) => issue.status === 'Done').length
      return { id: project._id.toString(), name: project.name, status: project.status, totalIssues: projectIssues.length, completedIssues: completed, progress: projectIssues.length ? Math.round((completed / projectIssues.length) * 100) : 0 }
    })
    return response.json({
      projects: { total: projects.length, active: projects.filter((project) => project.status === 'Active').length, completed: projects.filter((project) => project.status === 'Completed').length },
      issues: { total: issues.length, bugs: byType.Bug, tasks: byType.Task, features: byType.Feature, completed: byStatus.Done, inProgress: byStatus['In progress'], todo: byStatus.Todo, overdue: overdueIssues },
      byPriority,
      byStatus,
      projectProgress,
      teamWorkload: [...workload.values()].sort((left, right) => right.total - left.total),
    })
  } catch (error) {
    return response.status(500).json({ message: error instanceof Error ? error.message : 'Could not load reports' })
  }
})

const projectStatuses = ['Planning', 'Active', 'On hold', 'Completed', 'Archived'] as const
type ProjectStatus = typeof projectStatuses[number]
type ProjectInput = { name?: string; description?: string; members?: string[]; status?: ProjectStatus; startDate?: string | null; deadline?: string | null }
type PopulatedProjectUser = { _id?: mongoose.Types.ObjectId | string; id?: string; name?: string; email?: string; role?: string; avatar?: string }

const publicProjectUser = (user: PopulatedProjectUser) => ({
  id: user._id?.toString() ?? user.id ?? '',
  name: user.name ?? '',
  email: user.email ?? '',
  role: user.role ?? 'Member',
  avatar: user.avatar ?? '',
})

const publicProject = (project: { _id: mongoose.Types.ObjectId | string; name: string; description: string; owner: PopulatedProjectUser; members: PopulatedProjectUser[]; status: ProjectStatus; startDate?: Date; deadline?: Date; createdAt?: Date; updatedAt?: Date }) => ({
  id: project._id.toString(),
  name: project.name,
  description: project.description,
  owner: publicProjectUser(project.owner),
  members: project.members.map(publicProjectUser),
  status: project.status,
  startDate: project.startDate ?? null,
  deadline: project.deadline ?? null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
})

const projectAccess = (userId: string) => ({ $or: [{ owner: userId }, { members: userId }] })
const projectUnavailable = (response: express.Response) => response.status(503).json({ message: 'Project management requires an active MongoDB connection' })
const parseProjectDate = (value: string | null | undefined, field: string) => {
  if (value === null || value === '') return undefined
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid date`)
  return date
}

const loadProject = (id: string) => ProjectModel.findById(id)
  .populate('owner', 'name email role avatar')
  .populate('members', 'name email role avatar')
  .lean()

app.post('/api/projects', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  try {
    const input = request.body as ProjectInput
    const name = input.name?.trim()
    if (!name) return response.status(400).json({ message: 'Project name is required' })
    if (input.description && input.description.trim().length > 2000) return response.status(400).json({ message: 'Description cannot exceed 2000 characters' })
    if (input.status && !projectStatuses.includes(input.status)) return response.status(400).json({ message: 'Invalid project status' })
    const ownerId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!ownerId || !mongoose.isValidObjectId(ownerId)) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const memberIds = [...new Set([ownerId, ...(input.members ?? [])])]
    if (memberIds.some((memberId) => !mongoose.isValidObjectId(memberId))) return response.status(400).json({ message: 'Members must be valid user IDs' })
    const users = await UserModel.find({ _id: { $in: memberIds } }).select('_id').lean()
    if (users.length !== memberIds.length) return response.status(400).json({ message: 'One or more members could not be found' })
    const startDate = parseProjectDate(input.startDate, 'Start date')
    const deadline = parseProjectDate(input.deadline, 'Deadline')
    if (startDate && deadline && deadline < startDate) return response.status(400).json({ message: 'Deadline cannot be before the start date' })
    const project = await ProjectModel.create({ name, description: input.description?.trim() ?? '', owner: ownerId, members: memberIds, status: input.status ?? 'Planning', startDate, deadline })
    await recordActivity({ actor: new mongoose.Types.ObjectId(ownerId), action: `created project "${project.name}"`, entityType: 'Project', entityId: project._id.toString(), projectId: project._id, metadata: { name: project.name } })
    const populated = await loadProject(project.id)
    return response.status(201).json(publicProject(populated as never))
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : 'Could not create project' })
  }
})

app.get('/api/projects', auth, async (_request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const projects = await ProjectModel.find(projectAccess(userId)).sort({ createdAt: -1 }).populate('owner', 'name email role avatar').populate('members', 'name email role avatar').lean()
  return response.json(projects.map((project) => publicProject(project as never)))
})

app.get('/api/projects/:id', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid project ID' })
  const project = await ProjectModel.findOne({ _id: request.params.id, ...projectAccess(userId) }).populate('owner', 'name email role avatar').populate('members', 'name email role avatar').lean()
  return project ? response.json(publicProject(project as never)) : response.status(404).json({ message: 'Project not found' })
})

app.post('/api/projects/:id/members', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  const memberId = request.body?.userId as string | undefined
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(memberId)) return response.status(400).json({ message: 'Project and user IDs must be valid' })
  const member = await UserModel.findById(memberId).select('_id').lean()
  if (!member) return response.status(404).json({ message: 'User not found' })
  const project = await ProjectModel.findOneAndUpdate({ _id: request.params.id, owner: userId }, { $addToSet: { members: memberId } }, { new: true }).populate('owner', 'name email role avatar').populate('members', 'name email role avatar').lean()
  if (project) await createNotification({ recipient: new mongoose.Types.ObjectId(memberId), type: 'project_member', title: 'Added to a project', message: `You were added to project "${project.name}"`, relatedProject: project._id })
  return project ? response.json(publicProject(project as never)) : response.status(404).json({ message: 'Project not found or permission denied' })
})

app.delete('/api/projects/:id/members/:userId', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.userId)) return response.status(400).json({ message: 'Project and user IDs must be valid' })
  if (userId === request.params.userId) return response.status(400).json({ message: 'The project owner cannot be removed' })
  const project = await ProjectModel.findOneAndUpdate({ _id: request.params.id, owner: userId }, { $pull: { members: request.params.userId } }, { new: true }).populate('owner', 'name email role avatar').populate('members', 'name email role avatar').lean()
  return project ? response.json(publicProject(project as never)) : response.status(404).json({ message: 'Project not found or permission denied' })
})

app.patch('/api/projects/:id', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  try {
    const input = request.body as ProjectInput
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid project ID' })
    const updates: Record<string, unknown> = {}
    if (input.name !== undefined) {
      if (!input.name.trim()) return response.status(400).json({ message: 'Project name cannot be empty' })
      updates.name = input.name.trim()
    }
    if (input.description !== undefined) {
      if (input.description.trim().length > 2000) return response.status(400).json({ message: 'Description cannot exceed 2000 characters' })
      updates.description = input.description.trim()
    }
    if (input.status !== undefined) {
      if (!projectStatuses.includes(input.status)) return response.status(400).json({ message: 'Invalid project status' })
      updates.status = input.status
    }
    if (input.members !== undefined) {
      const owner = await ProjectModel.findOne({ _id: request.params.id, owner: userId }).select('_id').lean()
      if (!owner) return response.status(403).json({ message: 'Only the project owner can change members' })
      const memberIds = [...new Set([userId, ...input.members])]
      if (memberIds.some((memberId) => !mongoose.isValidObjectId(memberId))) return response.status(400).json({ message: 'Members must be valid user IDs' })
      const users = await UserModel.find({ _id: { $in: memberIds } }).select('_id').lean()
      if (users.length !== memberIds.length) return response.status(400).json({ message: 'One or more members could not be found' })
      updates.members = memberIds
    }
    if (input.startDate !== undefined) updates.startDate = parseProjectDate(input.startDate, 'Start date')
    if (input.deadline !== undefined) updates.deadline = parseProjectDate(input.deadline, 'Deadline')
    const existing = await ProjectModel.findOne({ _id: request.params.id, ...projectAccess(userId) }).lean()
    if (!existing) return response.status(404).json({ message: 'Project not found' })
    const startDate = (updates.startDate as Date | undefined) ?? existing.startDate
    const deadline = (updates.deadline as Date | undefined) ?? existing.deadline
    if (startDate && deadline && deadline < startDate) return response.status(400).json({ message: 'Deadline cannot be before the start date' })
    const project = await ProjectModel.findOneAndUpdate({ _id: request.params.id, ...projectAccess(userId) }, updates, { new: true, runValidators: true }).populate('owner', 'name email role avatar').populate('members', 'name email role avatar').lean()
    if (project) await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: updates.status === 'Archived' ? `archived project "${project.name}"` : `updated project "${project.name}"`, entityType: 'Project', entityId: project._id.toString(), projectId: project._id, metadata: updates })
    if (project && input.members !== undefined) {
      const previousMembers = new Set(existing.members.map((member) => member.toString()))
      const addedMembers = project.members.filter((member) => !previousMembers.has(member._id?.toString() ?? ''))
      await createNotificationsForUsers(addedMembers.map((member) => new mongoose.Types.ObjectId(member._id?.toString() ?? '')), { type: 'project_member', title: 'Added to a project', message: `You were added to project "${project.name}"`, relatedProject: project._id })
    }
    return project ? response.json(publicProject(project as never)) : response.status(404).json({ message: 'Project not found' })
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : 'Could not update project' })
  }
})

app.delete('/api/projects/:id', auth, async (request, response) => {
  if (!isMongo()) return projectUnavailable(response)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid project ID' })
  const project = await ProjectModel.findOne({ _id: request.params.id, owner: userId }).select('_id name').lean()
  if (project) await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: `deleted project "${project.name}"`, entityType: 'Project', entityId: project._id.toString(), projectId: project._id, metadata: { name: project.name } })
  const result = await ProjectModel.deleteOne({ _id: request.params.id, owner: userId })
  return result.deletedCount ? response.status(204).send() : response.status(404).json({ message: 'Project not found' })
})

type IssueInput = { title?: string; type?: IssueType; priority?: Priority; projectId?: string; assigneeId?: string }
type StoredIssue = { _id?: mongoose.Types.ObjectId | string; id?: string | null; issueNumber?: string | null; title: string; type: IssueType; priority: Priority; status: string; assignee: string; assigneeId?: { _id?: mongoose.Types.ObjectId | string; name?: string; email?: string; role?: string; avatar?: string } | mongoose.Types.ObjectId | string; initials: string; tone: string; projectId?: { _id?: mongoose.Types.ObjectId | string; name?: string } | mongoose.Types.ObjectId | string }

const publicIssue = (issue: StoredIssue): Issue => {
  const project = typeof issue.projectId === 'object' && issue.projectId !== null && 'name' in issue.projectId ? issue.projectId : undefined
  const projectId = typeof issue.projectId === 'object' && issue.projectId !== null && '_id' in issue.projectId ? issue.projectId._id?.toString() : issue.projectId?.toString()
  const assignee = typeof issue.assigneeId === 'object' && issue.assigneeId !== null && 'name' in issue.assigneeId ? issue.assigneeId : undefined
  const assigneeId = typeof issue.assigneeId === 'object' && issue.assigneeId !== null && '_id' in issue.assigneeId ? issue.assigneeId._id?.toString() : issue.assigneeId?.toString()
  return { id: issue.issueNumber ?? issue.id ?? issue._id?.toString() ?? '', title: issue.title, type: issue.type, priority: issue.priority, status: issue.status, assignee: assignee?.name ?? issue.assignee, initials: issue.initials, tone: issue.tone, ...(assigneeId ? { assigneeId } : {}), ...(projectId ? { projectId } : {}), ...(project?.name ? { projectName: project.name } : {}) }
}

const nextIssueNumber = async () => {
  const counter = await IssueNumberModel.findOneAndUpdate({ key: 'issues' }, { $inc: { value: 1 }, $setOnInsert: { key: 'issues' } }, { new: true, upsert: true }).lean()
  if (!counter) throw new Error('Could not allocate issue number')
  return `VSF-${counter.value}`
}

const projectForUser = async (projectId: string, userId: string) => {
  if (!mongoose.isValidObjectId(projectId)) return null
  return ProjectModel.findOne({ _id: projectId, ...projectAccess(userId) }).lean()
}

app.get('/api/issues', auth, async (request, response) => {
  const projectId = typeof request.query.projectId === 'string' ? request.query.projectId : undefined
  if (!isMongo()) return projectId ? response.status(503).json({ message: 'Project issue filtering requires an active MongoDB connection' }) : response.json(memoryIssues)
  const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
  if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
  if (projectId) {
    if (!mongoose.isValidObjectId(projectId)) return response.status(400).json({ message: 'Invalid project ID' })
    if (!await projectForUser(projectId, userId)) return response.status(404).json({ message: 'Project not found' })
    const issues = await IssueModel.find({ projectId }).sort({ createdAt: -1 }).populate('projectId', 'name').populate('assigneeId', 'name email role avatar').lean()
    return response.json(issues.map((issue) => publicIssue(issue as never)))
  }
  const accessibleProjects = await ProjectModel.find(projectAccess(userId)).select('_id').lean()
  const issues = await IssueModel.find({ $or: [{ projectId: { $in: accessibleProjects.map((project) => project._id) } }, { projectId: { $exists: false } }] }).sort({ createdAt: -1 }).populate('projectId', 'name').populate('assigneeId', 'name email role avatar').lean()
  return response.json(issues.map((issue) => publicIssue(issue as never)))
})

app.post('/api/issues', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Creating an issue requires an active MongoDB connection' })
  try {
    const { title, type = 'Task', priority = 'Medium', projectId, assigneeId } = request.body as IssueInput
    if (!title?.trim()) return response.status(400).json({ message: 'Title is required' })
    if (!projectId) return response.status(400).json({ message: 'Project is required' })
    if (!assigneeId) return response.status(400).json({ message: 'Assignee is required' })
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    if (!mongoose.isValidObjectId(projectId)) return response.status(400).json({ message: 'Invalid project ID' })
    const project = await projectForUser(projectId, userId)
    if (!project) return response.status(404).json({ message: 'Project not found' })
    if (!mongoose.isValidObjectId(assigneeId)) return response.status(400).json({ message: 'Invalid assignee ID' })
    const assignee = await UserModel.findById(assigneeId).select('_id name email role avatar').lean()
    if (!assignee) return response.status(404).json({ message: 'Assignee not found' })
    if (!project.members.some((member) => member.toString() === assigneeId) && project.owner.toString() !== assigneeId) return response.status(400).json({ message: 'Assignee must be a member of the project' })
    if (!['Bug', 'Feature', 'Task'].includes(type)) return response.status(400).json({ message: 'Invalid issue type' })
    if (!['Urgent', 'High', 'Medium'].includes(priority)) return response.status(400).json({ message: 'Invalid issue priority' })
    const issueNumber = await nextIssueNumber()
    const issue = await IssueModel.create({ issueNumber, title: title.trim(), type, priority, status: 'Todo', assignee: assignee.name, assigneeId: assignee._id, initials: assignee.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: 'blue', projectId: project._id })
    await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: `created issue ${issueNumber}`, entityType: 'Issue', entityId: issueNumber, projectId: project._id, issueId: issue._id, metadata: { title: issue.title, type: issue.type, priority: issue.priority, assignee: assignee.name } })
    if (assignee._id.toString() !== userId) await createNotification({ recipient: assignee._id, type: 'assignment', title: 'Issue assigned to you', message: `You were assigned ${issueNumber}: ${issue.title}`, relatedProject: project._id, relatedIssue: issue._id })
    return response.status(201).json(publicIssue({ ...issue.toObject(), assigneeId: { _id: assignee._id, name: assignee.name }, projectId: { _id: project._id, name: project.name } }))
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : 'Could not create issue' })
  }
})

app.patch('/api/issues/:id', auth, async (request, response) => {
  const { status, assigneeId } = request.body as { status?: string; assigneeId?: string }
  if (!status) return response.status(400).json({ message: 'Status is required' })
  if (isMongo()) {
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const issue = await IssueModel.findOne({ $or: [{ issueNumber: request.params.id }, { id: request.params.id }] }).lean()
    if (!issue) return response.status(404).json({ message: 'Issue not found' })
    if (issue.projectId && !await projectForUser(issue.projectId.toString(), userId)) return response.status(404).json({ message: 'Issue not found' })
    const previousStatus = issue.status
    const previousAssignee = issue.assignee
    const updates: Record<string, unknown> = { status }
    if (assigneeId !== undefined) {
      if (!issue.projectId) return response.status(400).json({ message: 'Legacy issues cannot be assigned to a project user' })
      if (!mongoose.isValidObjectId(assigneeId)) return response.status(400).json({ message: 'Invalid assignee ID' })
      const project = await ProjectModel.findById(issue.projectId).lean()
      const assignee = await UserModel.findById(assigneeId).select('_id name').lean()
      if (!assignee) return response.status(404).json({ message: 'Assignee not found' })
      if (!project || (!project.members.some((member) => member.toString() === assigneeId) && project.owner.toString() !== assigneeId)) return response.status(400).json({ message: 'Assignee must be a member of the project' })
      updates.assigneeId = assignee._id
      updates.assignee = assignee.name
      updates.initials = assignee.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    }
    const updated = await IssueModel.findByIdAndUpdate(issue._id, updates, { new: true }).populate('projectId', 'name').populate('assigneeId', 'name email role avatar').lean()
    if (updated) {
      const projectId = issue.projectId ? new mongoose.Types.ObjectId(issue.projectId.toString()) : undefined
      const issueLabel = updated.issueNumber ?? updated.id ?? String(request.params.id)
      await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: `updated issue ${issueLabel}`, entityType: 'Issue', entityId: issueLabel, ...(projectId ? { projectId } : {}), issueId: updated._id, metadata: { status: updated.status, assignee: updated.assignee } })
      if (previousStatus !== updated.status) await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: `changed ${issueLabel} from ${previousStatus} to ${updated.status}`, entityType: 'Issue', entityId: issueLabel, ...(projectId ? { projectId } : {}), issueId: updated._id, metadata: { from: previousStatus, to: updated.status } })
      if (previousAssignee !== updated.assignee) await recordActivity({ actor: new mongoose.Types.ObjectId(userId), action: `assigned ${issueLabel} to ${updated.assignee}`, entityType: 'Issue', entityId: issueLabel, ...(projectId ? { projectId } : {}), issueId: updated._id, metadata: { from: previousAssignee, to: updated.assignee } })
      if (previousStatus !== updated.status && updated.assigneeId) {
        const recipient = typeof updated.assigneeId === 'object' && '_id' in updated.assigneeId ? updated.assigneeId._id : updated.assigneeId
        if (recipient && recipient.toString() !== userId) await createNotification({ recipient: new mongoose.Types.ObjectId(recipient.toString()), type: 'status_change', title: 'Issue status changed', message: `${issueLabel} changed from ${previousStatus} to ${updated.status}`, ...(projectId ? { relatedProject: projectId } : {}), relatedIssue: updated._id })
      }
      if (previousAssignee !== updated.assignee && updated.assigneeId) {
        const recipient = typeof updated.assigneeId === 'object' && '_id' in updated.assigneeId ? updated.assigneeId._id : updated.assigneeId
        if (recipient && recipient.toString() !== userId) await createNotification({ recipient: new mongoose.Types.ObjectId(recipient.toString()), type: 'assignment', title: 'Issue assigned to you', message: `You were assigned ${issueLabel}`, ...(projectId ? { relatedProject: projectId } : {}), relatedIssue: updated._id })
      }
    }
    return updated ? response.json(publicIssue(updated as never)) : response.status(404).json({ message: 'Issue not found' })
  }
  const issue = memoryIssues.find((item) => item.id === request.params.id)
  if (!issue) return response.status(404).json({ message: 'Issue not found' })
  issue.status = status
  return response.json(issue)
})

app.delete('/api/issues/:id', auth, async (request, response) => {
  if (isMongo()) {
    const userId = (response.locals.user as User & { _id?: mongoose.Types.ObjectId })._id?.toString()
    if (!userId) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const issue = await IssueModel.findOne({ $or: [{ issueNumber: request.params.id }, { id: request.params.id }] }).lean()
    if (!issue) return response.status(404).json({ message: 'Issue not found' })
    if (issue.projectId && !await projectForUser(issue.projectId.toString(), userId)) return response.status(404).json({ message: 'Issue not found' })
    await IssueModel.deleteOne({ _id: issue._id })
    return response.status(204).send()
  }
  const before = memoryIssues.length
  memoryIssues = memoryIssues.filter((issue) => issue.id !== request.params.id)
  return memoryIssues.length < before ? response.status(204).send() : response.status(404).json({ message: 'Issue not found' })
})

app.post('/api/issues/:issueId/comments', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Comments require an active MongoDB connection' })
  try {
    const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
    const issue = await commentIssueForUser(String(request.params.issueId), user._id?.toString() ?? '')
    if (!issue) return response.status(404).json({ message: 'Issue not found' })
    const content = (request.body as { content?: string }).content?.trim()
    if (!content) return response.status(400).json({ message: 'Comment content is required' })
    if (content.length > 5000) return response.status(400).json({ message: 'Comment cannot exceed 5000 characters' })
    if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
    const comment = await CommentModel.create({ issueId: issue._id, author: user._id, content })
    await recordActivity({ actor: user._id, action: `commented on issue ${request.params.issueId}`, entityType: 'Comment', entityId: comment._id.toString(), ...(issue.projectId ? { projectId: new mongoose.Types.ObjectId(issue.projectId.toString()) } : {}), issueId: issue._id, metadata: { issueId: request.params.issueId } })
    const commentedIssue = await IssueModel.findById(issue._id).select('issueNumber title assigneeId').lean()
    if (commentedIssue?.assigneeId && commentedIssue.assigneeId.toString() !== user._id.toString()) await createNotification({ recipient: new mongoose.Types.ObjectId(commentedIssue.assigneeId.toString()), type: 'comment', title: 'New comment on your issue', message: `${user.name} commented on ${commentedIssue.issueNumber ?? request.params.issueId}: ${commentedIssue.title}`, ...(issue.projectId ? { relatedProject: new mongoose.Types.ObjectId(issue.projectId.toString()) } : {}), relatedIssue: issue._id })
    const populated = await CommentModel.findById(comment._id).populate('author', 'name email role avatar').lean()
    return response.status(201).json(publicComment(populated as never))
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : 'Could not create comment' })
  }
})

app.get('/api/issues/:issueId/comments', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Comments require an active MongoDB connection' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  const issue = await commentIssueForUser(String(request.params.issueId), user._id?.toString() ?? '')
  if (!issue) return response.status(404).json({ message: 'Issue not found' })
  const comments = await CommentModel.find({ issueId: issue._id }).sort({ createdAt: 1 }).populate('author', 'name email role avatar').lean()
  return response.json(comments.map((comment) => publicComment(comment as never)))
})

app.patch('/api/comments/:id', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Comments require an active MongoDB connection' })
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid comment ID' })
    const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
    const comment = await CommentModel.findById(request.params.id).select('author').lean()
    if (!comment) return response.status(404).json({ message: 'Comment not found' })
    if (!user._id || !canManageComment(user, comment.author.toString())) return response.status(403).json({ message: 'You do not have permission to edit this comment' })
    const content = (request.body as { content?: string }).content?.trim()
    if (!content) return response.status(400).json({ message: 'Comment content is required' })
    if (content.length > 5000) return response.status(400).json({ message: 'Comment cannot exceed 5000 characters' })
    const updated = await CommentModel.findByIdAndUpdate(request.params.id, { content }, { new: true, runValidators: true }).populate('author', 'name email role avatar').lean()
    return updated ? response.json(publicComment(updated as never)) : response.status(404).json({ message: 'Comment not found' })
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : 'Could not update comment' })
  }
})

app.delete('/api/comments/:id', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Comments require an active MongoDB connection' })
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid comment ID' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  const comment = await CommentModel.findById(request.params.id).select('author').lean()
  if (!comment) return response.status(404).json({ message: 'Comment not found' })
  if (!user._id || !canManageComment(user, comment.author.toString())) return response.status(403).json({ message: 'You do not have permission to delete this comment' })
  await CommentModel.deleteOne({ _id: request.params.id })
  return response.status(204).send()
})

app.get('/api/activity', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Activity history requires an active MongoDB connection' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const projectId = typeof request.query.projectId === 'string' ? request.query.projectId : undefined
  const issueId = typeof request.query.issueId === 'string' ? request.query.issueId : undefined
  const entityType = typeof request.query.entityType === 'string' ? request.query.entityType : undefined
  const entityId = typeof request.query.entityId === 'string' ? request.query.entityId : undefined
  let accessibleProjectIds: mongoose.Types.ObjectId[]
  if (projectId) {
    if (!mongoose.isValidObjectId(projectId) || !await projectForUser(projectId, user._id.toString())) return response.status(404).json({ message: 'Project not found' })
    accessibleProjectIds = [new mongoose.Types.ObjectId(projectId)]
  } else {
    const projects = await ProjectModel.find(projectAccess(user._id.toString())).select('_id').lean()
    accessibleProjectIds = projects.map((project) => project._id)
  }
  const filter: Record<string, unknown> = { projectId: { $in: accessibleProjectIds } }
  if (issueId) {
    const issue = await commentIssueForUser(issueId, user._id.toString())
    if (!issue) return response.status(404).json({ message: 'Issue not found' })
    filter.issueId = issue._id
  }
  if (entityType) {
    if (!['Project', 'Issue', 'Comment'].includes(entityType)) return response.status(400).json({ message: 'Invalid activity entity type' })
    filter.entityType = entityType
  }
  if (entityId) filter.entityId = entityId
  const activities = await ActivityModel.find(filter).sort({ createdAt: -1 }).limit(100).populate('actor', 'name email role avatar').lean()
  return response.json(activities.map((activity) => ({ id: activity._id.toString(), action: activity.action, entityType: activity.entityType, entityId: activity.entityId, projectId: activity.projectId?.toString(), issueId: activity.issueId?.toString(), metadata: activity.metadata, actor: publicDirectoryUser(activity.actor as never), createdAt: activity.createdAt })))
})

app.get('/api/notifications', auth, async (_request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Notifications require an active MongoDB connection' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const notifications = await NotificationModel.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(100).populate('relatedProject', 'name').populate('relatedIssue', 'issueNumber title').lean() as unknown as Array<{ _id: mongoose.Types.ObjectId; type: NotificationType; title: string; message: string; read: boolean; relatedProject?: { _id: mongoose.Types.ObjectId; name: string }; relatedIssue?: { _id: mongoose.Types.ObjectId; issueNumber?: string; title?: string }; createdAt?: Date }>
  return response.json(notifications.map((notification) => ({ id: notification._id.toString(), type: notification.type, title: notification.title, message: notification.message, read: notification.read, relatedProject: notification.relatedProject ? { id: notification.relatedProject._id.toString(), name: notification.relatedProject.name } : undefined, relatedIssue: notification.relatedIssue ? { id: notification.relatedIssue._id.toString(), issueNumber: notification.relatedIssue.issueNumber, title: notification.relatedIssue.title } : undefined, createdAt: notification.createdAt })))
})

app.patch('/api/notifications/:id/read', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Notifications require an active MongoDB connection' })
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid notification ID' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const notification = await NotificationModel.findOneAndUpdate({ _id: request.params.id, recipient: user._id }, { read: true }, { new: true }).lean()
  return notification ? response.json({ id: notification._id.toString(), read: notification.read }) : response.status(404).json({ message: 'Notification not found' })
})

app.patch('/api/notifications/read-all', auth, async (_request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Notifications require an active MongoDB connection' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const result = await NotificationModel.updateMany({ recipient: user._id, read: false }, { read: true })
  return response.json({ updated: result.modifiedCount })
})

app.delete('/api/notifications/:id', auth, async (request, response) => {
  if (!isMongo()) return response.status(503).json({ message: 'Notifications require an active MongoDB connection' })
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid notification ID' })
  const user = response.locals.user as User & { _id?: mongoose.Types.ObjectId }
  if (!user._id) return response.status(401).json({ message: 'Authenticated user is invalid' })
  const result = await NotificationModel.deleteOne({ _id: request.params.id, recipient: user._id })
  return result.deletedCount ? response.status(204).send() : response.status(404).json({ message: 'Notification not found' })
})

app.listen(port, () => console.log(`VSR Forge API listening on http://localhost:${port}`))

if (mongoUri) {
  mongoose.connect(mongoUri).then(() => console.log('MongoDB connected')).catch((error) => console.error('MongoDB unavailable; using memory store', error.message))
}

const commentIssueForUser = async (issueId: string, userId: string) => {
  const identifiers: Record<string, string>[] = [{ issueNumber: issueId }, { id: issueId }]
  if (mongoose.isValidObjectId(issueId)) identifiers.push({ _id: issueId })
  const issue = await IssueModel.findOne({ $or: identifiers }).select('_id projectId').lean()
  if (!issue) return null
  if (issue.projectId && !await projectForUser(issue.projectId.toString(), userId)) return null
  return issue
}

const publicComment = (comment: { _id: mongoose.Types.ObjectId | string; content: string; author: { _id?: mongoose.Types.ObjectId | string; name: string; email: string; role?: string; avatar?: string }; createdAt?: Date; updatedAt?: Date }) => ({
  id: comment._id.toString(),
  content: comment.content,
  author: publicDirectoryUser(comment.author),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
})

const canManageComment = (user: User & { _id?: mongoose.Types.ObjectId }, authorId: string) => user._id?.toString() === authorId || ['Admin', 'Manager', 'Project Manager'].includes(user.role)
type ActivityEntity = 'Project' | 'Issue' | 'Comment'
const recordActivity = async (input: { actor: mongoose.Types.ObjectId; action: string; entityType: ActivityEntity; entityId: string; projectId?: mongoose.Types.ObjectId; issueId?: mongoose.Types.ObjectId; metadata?: Record<string, unknown> }) => {
  try { await ActivityModel.create(input) } catch (error) { console.error('Could not record activity', error instanceof Error ? error.message : error) }
}
type NotificationType = 'assignment' | 'status_change' | 'comment' | 'project_member' | 'deadline'
const createNotification = async (input: { recipient: mongoose.Types.ObjectId; type: NotificationType; title: string; message: string; relatedProject?: mongoose.Types.ObjectId; relatedIssue?: mongoose.Types.ObjectId }) => {
  try { await NotificationModel.create(input) } catch (error) { console.error('Could not create notification', error instanceof Error ? error.message : error) }
}
const createNotificationsForUsers = async (recipients: mongoose.Types.ObjectId[], input: Omit<Parameters<typeof createNotification>[0], 'recipient'>) => {
  await Promise.all([...new Map(recipients.map((recipient) => [recipient.toString(), recipient])).values()].map((recipient) => createNotification({ recipient, ...input })))
}