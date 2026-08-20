import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  issueNumber: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Bug', 'Feature', 'Task'], required: true },
  priority: { type: String, enum: ['Urgent', 'High', 'Medium'], required: true },
  status: { type: String, required: true },
  assignee: { type: String, required: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  initials: { type: String, required: true },
  tone: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true })

issueSchema.index({ projectId: 1, createdAt: -1 })

export const IssueModel = mongoose.model('Issue', issueSchema)