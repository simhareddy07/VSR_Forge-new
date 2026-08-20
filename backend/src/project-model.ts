import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Planning', 'Active', 'On hold', 'Completed', 'Archived'], default: 'Planning' },
  startDate: { type: Date },
  deadline: { type: Date },
}, { timestamps: true })

projectSchema.index({ owner: 1, createdAt: -1 })
projectSchema.index({ members: 1, createdAt: -1 })

export const ProjectModel = mongoose.model('Project', projectSchema)
