import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
}, { timestamps: true })

commentSchema.index({ issueId: 1, createdAt: 1 })

export const CommentModel = mongoose.model('Comment', commentSchema)
