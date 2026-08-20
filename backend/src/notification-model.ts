import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['assignment', 'status_change', 'comment', 'project_member', 'deadline'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  relatedIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

notificationSchema.index({ recipient: 1, createdAt: -1 })

export const NotificationModel = mongoose.model('Notification', notificationSchema)
