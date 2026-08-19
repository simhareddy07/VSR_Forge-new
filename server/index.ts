import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { IssueModel } from './issue-model.js'
import type { Issue, IssueType, Priority } from './types.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const mongoUri = process.env.MONGODB_URI
let memoryIssues: Issue[] = [
  { id: 'BUG-101', title: 'Login button not working on mobile', type: 'Bug', priority: 'Urgent', status: 'In progress', assignee: 'Rahul K.', initials: 'RK', tone: 'coral' },
  { id: 'FEAT-104', title: 'Add dark mode to workspace', type: 'Feature', priority: 'Medium', status: 'Todo', assignee: 'Priya S.', initials: 'PS', tone: 'violet' },
  { id: 'TASK-103', title: 'Create product search component', type: 'Task', priority: 'High', status: 'Code review', assignee: 'Vijay R.', initials: 'VR', tone: 'blue' },
  { id: 'BUG-102', title: 'Payment API returns a 502 error', type: 'Bug', priority: 'High', status: 'Testing', assignee: 'Ananya M.', initials: 'AM', tone: 'amber' },
  { id: 'TASK-098', title: 'Update onboarding documentation', type: 'Task', priority: 'Medium', status: 'Done', assignee: 'Kiran P.', initials: 'KP', tone: 'mint' },
]

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true }))
app.use(express.json())

const useMongo = () => mongoose.connection.readyState === 1
const nextId = (type: IssueType) => `${type === 'Bug' ? 'BUG' : type === 'Feature' ? 'FEAT' : 'TASK'}-${Math.floor(Math.random() * 800 + 200)}`

app.get('/api/health', (_request, response) => response.json({ ok: true, database: useMongo() ? 'mongodb' : 'memory' }))

app.get('/api/issues', async (_request, response) => {
  if (useMongo()) return response.json(await IssueModel.find().sort({ createdAt: -1 }).lean())
  return response.json(memoryIssues)
})

app.post('/api/issues', async (request, response) => {
  const { title, type = 'Task', priority = 'Medium' } = request.body as { title?: string; type?: IssueType; priority?: Priority }
  if (!title?.trim()) return response.status(400).json({ message: 'Title is required' })
  const issue: Issue = { id: nextId(type), title: title.trim(), type, priority, status: 'Todo', assignee: 'Vijay R.', initials: 'VR', tone: 'blue' }
  if (useMongo()) return response.status(201).json(await IssueModel.create(issue))
  memoryIssues = [issue, ...memoryIssues]
  return response.status(201).json(issue)
})

app.patch('/api/issues/:id', async (request, response) => {
  const { status } = request.body as { status?: string }
  if (!status) return response.status(400).json({ message: 'Status is required' })
  if (useMongo()) {
    const issue = await IssueModel.findOneAndUpdate({ id: request.params.id }, { status }, { new: true }).lean()
    return issue ? response.json(issue) : response.status(404).json({ message: 'Issue not found' })
  }
  const issue = memoryIssues.find((item) => item.id === request.params.id)
  if (!issue) return response.status(404).json({ message: 'Issue not found' })
  issue.status = status
  return response.json(issue)
})

app.delete('/api/issues/:id', async (request, response) => {
  if (useMongo()) {
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