import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, trim: true },
  entityType: { type: String, enum: ['Project', 'Issue', 'Comment'], required: true },
  entityId: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } })

activitySchema.index({ projectId: 1, createdAt: -1 })
activitySchema.index({ issueId: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })

export const ActivityModel = mongoose.model('Activity', activitySchema)
