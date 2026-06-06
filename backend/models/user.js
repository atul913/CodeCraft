const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['student', 'instructor', 'enterprise', 'admin'], default: 'student' },
  profile: {
    name:      { type: String, default: '' },
    bio:       { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    socials: {
      github:   { type: String, default: '' },
      linkedin: { type: String, default: '' }
    }
  },
  stats: {
    problemsSolved:   { type: Number, default: 0 },
    easySolved:       { type: Number, default: 0 },
    mediumSolved:     { type: Number, default: 0 },
    hardSolved:       { type: Number, default: 0 },
    submissionsCount: { type: Number, default: 0 },
    reputation:       { type: Number, default: 0 },
    streak:           { type: Number, default: 0 }
  },
  solvedProblems:     [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  bookmarkedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  lastLoginAt: { type: Date },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)