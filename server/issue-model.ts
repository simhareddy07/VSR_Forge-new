import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Bug', 'Feature', 'Task'], required: true },
  priority: { type: String, enum: ['Urgent', 'High', 'Medium'], required: true },
  status: { type: String, required: true },
  assignee: { type: String, required: true },
  initials: { type: String, required: true },
  tone: { type: String, required: true },
}, { timestamps: true })

export const IssueModel = mongoose.model('Issue', issueSchema)