const mongoose = require('mongoose')
const { Schema } = mongoose

const userProblemStatusSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },

  status: {
    type: String,
    enum: ['Solved', 'Attempted', 'Unsolved'],
    default: 'Unsolved'
  },

  attempts:        { type: Number, default: 0 },
  lastLanguage:    { type: String, default: '' },
  lastSubmittedAt: { type: Date },
  firstSolvedAt:   { type: Date }
}, { timestamps: true })

userProblemStatusSchema.index({ userId: 1, problemId: 1 }, { unique: true })

module.exports = mongoose.models.UserProblemStatus || mongoose.model('UserProblemStatus', userProblemStatusSchema)