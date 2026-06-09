const mongoose = require('mongoose')
const { Schema } = mongoose

const testCaseSchema = new Schema({
  input:          { type: String, required: true },
  expectedOutput: { type: String, required: true },
  explanation:    { type: String, default: '' }
}, { _id: false })

const problemSchema = new Schema({
  slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  title:       { type: String, required: true, trim: true },
  difficulty:  { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  categories:  [{ type: String, trim: true }],
  tags:        [{ type: String, trim: true }],
  description: { type: String, required: true },
  constraints: [{ type: String }],

  visibleTestCases: [testCaseSchema],
  hiddenTestCases:  [testCaseSchema],

  supportedLanguages: [{ type: String }],

  starterCode:       { type: Map, of: String },
  solutionTemplates: { type: Map, of: String },

  inputFormat:  { type: String, default: '' },
// e.g. "First line contains n. Second line contains n integers..."

  outputFormat: { type: String, default: '' },
// e.g. "Print two space-separated integers — the indices of the two numbers."

  timeLimit:   { type: Number, default: 2000 },
  memoryLimit: { type: Number, default: 256 },

  likes:    { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },

  editorial: {
    content:  { type: String, default: '' },
    videoUrl: { type: String, default: '' }
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true })

problemSchema.index({ difficulty: 1 })
problemSchema.index({ categories: 1 })
problemSchema.index({ isActive: 1 })
problemSchema.index({ difficulty: 1, isActive: 1 })

module.exports = mongoose.models.Problem || mongoose.model('Problem', problemSchema)