import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { IssueModel } from './issue-model.js'
import { IssueNumberModel } from './issue-number-model.js'
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

app.listen(port, () => console.log(`VSR Forge API listening on http://localhost:${port}`))

if (mongoUri) {
  mongoose.connect(mongoUri).then(() => console.log('MongoDB connected')).catch((error) => console.error('MongoDB unavailable; using memory store', error.message))
}