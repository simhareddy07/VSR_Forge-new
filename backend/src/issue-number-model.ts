import mongoose from 'mongoose'

const issueNumberSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 100 },
})

export const IssueNumberModel = mongoose.model('IssueNumber', issueNumberSchema)
