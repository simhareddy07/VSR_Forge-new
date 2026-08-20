import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { IssueModel } from './issue-model.js'
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
const nextId = (type: IssueType) => `${type === 'Bug' ? 'BUG' : type === 'Feature' ? 'FEAT' : 'TASK'}-${Math.floor(Math.random() * 800 + 200)}`
const publicUser = (user: User) => ({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar })
const createToken = (user: User) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' })
const auth = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return response.status(401).json({ message: 'Authentication required' })
  try {
    const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload
    const user = isMongo() ? await UserModel.findById(payload.sub).lean() : memoryUsers.find((item) => item.id === payload.sub)
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

app.get('/api/issues', auth, async (_request, response) => {
  if (isMongo()) return response.json(await IssueModel.find().sort({ createdAt: -1 }).lean())
  return response.json(memoryIssues)
})

app.post('/api/issues', auth, async (request, response) => {
  const { title, type = 'Task', priority = 'Medium' } = request.body as { title?: string; type?: IssueType; priority?: Priority }
  if (!title?.trim()) return response.status(400).json({ message: 'Title is required' })
  const issue: Issue = { id: nextId(type), title: title.trim(), type, priority, status: 'Todo', assignee: 'Vijay R.', initials: 'VR', tone: 'blue' }
  if (isMongo()) return response.status(201).json(await IssueModel.create(issue))
  memoryIssues = [issue, ...memoryIssues]
  return response.status(201).json(issue)
})

app.patch('/api/issues/:id', auth, async (request, response) => {
  const { status } = request.body as { status?: string }
  if (!status) return response.status(400).json({ message: 'Status is required' })
  if (isMongo()) {
    const issue = await IssueModel.findOneAndUpdate({ id: request.params.id }, { status }, { new: true }).lean()
    return issue ? response.json(issue) : response.status(404).json({ message: 'Issue not found' })
  }
  const issue = memoryIssues.find((item) => item.id === request.params.id)
  if (!issue) return response.status(404).json({ message: 'Issue not found' })
  issue.status = status
  return response.json(issue)
})

app.delete('/api/issues/:id', auth, async (request, response) => {
  if (isMongo()) {
    const result = await IssueModel.deleteOne({ id: request.params.id })
    return result.deletedCount ? response.status(204).send() : response.status(404).json({ message: 'Issue not found' })
  }
  const before = memoryIssues.length
  memoryIssues = memoryIssues.filter((issue) => issue.id !== request.params.id)
  return memoryIssues.length < before ? response.status(204).send() : response.status(404).json({ message: 'Issue not found' })
})

app.listen(port, () => console.log(`VSR Forge API listening on http://localhost:${port}`))

if (mongoUri) {
  mongoose.connect(mongoUri).then(() => console.log('MongoDB connected')).catch((error) => console.error('MongoDB unavailable; using memory store', error.message))
}