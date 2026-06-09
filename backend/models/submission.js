const mongoose = require('mongoose')
const { Schema } = mongoose

const submissionSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
  language:  { type: String, required: true },
  code:      { type: String, required: true },

  verdict: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Compile Error', 'Runtime Error'],
    default: 'Pending'
  },

  runtimeMs:     { type: Number, default: 0 },
  memoryUsageMb: { type: Number, default: 0 },

  passedTestCases: { type: Number, default: 0 },
  totalTestCases:  { type: Number, default: 0 },

  errorMessage:         { type: String, default: '' },
  judge0SubmissionToken: { type: String, default: '' },
  isRun:                { type: Boolean, default: false },

  executionDetails: [{
    testCaseId: { type: String },
    status:     { type: String },
    runtimeMs:  { type: Number, default: 0 },
    output:     { type: String, default: '' },  
    expected:   { type: String, default: '' }   
  }],

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true })

submissionSchema.index({ userId: 1 })
submissionSchema.index({ problemId: 1 })
submissionSchema.index({ userId: 1, problemId: 1 })
submissionSchema.index({ submittedAt: -1 })

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema)