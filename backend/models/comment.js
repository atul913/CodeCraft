const mongoose = require('mongoose')
const { Schema } = mongoose

const commentSchema = new Schema({
  authorId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentType: { type: String, enum: ['problem', 'contest', 'blog'], default: 'problem' },
  parentId:   { type: Schema.Types.ObjectId, required: true },
  content:    { type: String, required: true, trim: true, maxlength: 2000 },
  replyTo:    { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  upvotes:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isDeleted:  { type: Boolean, default: false }
}, { timestamps: true })

commentSchema.index({ parentId: 1, parentType: 1, createdAt: 1 })
commentSchema.index({ replyTo: 1 })

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema)