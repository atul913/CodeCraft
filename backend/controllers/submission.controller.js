const Problem           = require('../models/problem')
const Submission        = require('../models/submission')
const UserProblemStatus = require('../models/userProblemStatus')
const User              = require('../models/user')
const { judgeSubmission } = require('../services/submission.service')
const { getTier }       = require('../utils/ratingSystem')

// POST /api/submissions/run
// runs against visible test cases only, does NOT update stats
const runCode = async (req, res) => {
  try {
    const { problemId, language, code } = req.body
    const userId = req.user.id

    if (!problemId || !language || !code)
      return res.status(400).json({ success: false, message: 'problemId, language and code are required' })

    const problem = await Problem.findById(problemId)
    if (!problem)
      return res.status(404).json({ success: false, message: 'Problem not found' })

    if (!problem.supportedLanguages.includes(language))
      return res.status(400).json({ success: false, message: `Language ${language} not supported for this problem` })

    const { verdict, results, passedCount, totalTestCases, runtimeMs, errorMessage }
      = await judgeSubmission(code, language, problem.visibleTestCases, problem.timeLimit)

    const submission = new Submission({
      userId,
      problemId,
      language,
      code,
      verdict,
      isRun:           true,   // run code — does not count toward stats
      passedTestCases: passedCount,
      totalTestCases,
      runtimeMs,
      errorMessage,
      executionDetails: results.map(r => ({
                            testCaseId: r.testCaseId,
                            status:     r.status,
                            runtimeMs:  r.runtimeMs,
                            output:     r.output || '',  
                            expected:   r.expected || '' 
                          })),
      submittedAt: new Date()
    })

    await submission.save()

    res.status(200).json({ success: true, data: submission })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/submissions/submit
// runs against ALL test cases, updates user stats
const submitCode = async (req, res) => {
  try {
    const { problemId, language, code } = req.body
    const userId = req.user.id

    if (!problemId || !language || !code)
      return res.status(400).json({ success: false, message: 'problemId, language and code are required' })

    const problem = await Problem.findById(problemId)
    if (!problem)
      return res.status(404).json({ success: false, message: 'Problem not found' })

    if (!problem.supportedLanguages.includes(language))
      return res.status(400).json({ success: false, message: `Language ${language} not supported for this problem` })

    // combine visible + hidden for final judging
    const allTestCases = [...problem.visibleTestCases, ...problem.hiddenTestCases]

    const { verdict, results, passedCount, totalTestCases, runtimeMs, errorMessage }
      = await judgeSubmission(code, language, allTestCases, problem.timeLimit)

    const submission = new Submission({
      userId,
      problemId,
      language,
      code,
      verdict,
      isRun:false,  // real submission — counts toward stats
      passedTestCases: passedCount,
      totalTestCases,
      runtimeMs,
      errorMessage,
      executionDetails: results.map(r => ({ testCaseId: r.testCaseId, status: r.status })),
      submittedAt: new Date()
    })

    await submission.save()

    // update stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.submissionsCount': 1 }
    })

    if (verdict === 'Accepted') {
      const existing = await UserProblemStatus.findOne({ userId, problemId })
      const alreadySolved = existing?.status === 'Solved'

      if (!alreadySolved) {
        // first time solving — update all stats
        await UserProblemStatus.findOneAndUpdate(
          { userId, problemId },
          {
            status:          'Solved',
            lastLanguage:    language,
            lastSubmittedAt: new Date(),
            firstSolvedAt:   new Date(),
            $inc: { attempts: 1 }
          },
          { upsert: true }
        )

        // increment difficulty-specific counter
        const diffKey = `stats.${problem.difficulty.toLowerCase()}Solved`
        await User.findByIdAndUpdate(userId, {
          $inc:      { 'stats.problemsSolved': 1, [diffKey]: 1 },
          $addToSet: { solvedProblems: problemId }
        })
      } else {
        // solved before — just update last attempt info
        await UserProblemStatus.findOneAndUpdate(
          { userId, problemId },
          { lastLanguage: language, lastSubmittedAt: new Date(), $inc: { attempts: 1 } }
        )
      }
    } else {
      // wrong/error — mark as attempted
      await UserProblemStatus.findOneAndUpdate(
        { userId, problemId },
        {
          status:          'Attempted',
          lastLanguage:    language,
          lastSubmittedAt: new Date(),
          $inc: { attempts: 1 }
        },
        { upsert: true }
      )
    }

    res.status(200).json({ success: true, data: submission })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/submissions/problem/:problemId
const getUserProblemSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId:    req.user.id,
      problemId: req.params.problemId,
      isRun:     false   // only real submissions, not run code
    })
    .select('verdict language passedTestCases totalTestCases runtimeMs submittedAt')
    .sort({ submittedAt: -1 })
    .limit(20)

    res.status(200).json({ success: true, data: submissions })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/submissions/recent
const getRecentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ isRun: false })
      .select('userId problemId verdict language submittedAt')
      .populate('userId', 'username rating.contest rating.isRated')
      .populate('problemId', 'title slug difficulty')
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean();

    const data = submissions.map(s => {
      const contestRating = s.userId?.rating?.contest ?? 1500;
      const isRated = s.userId?.rating?.isRated ?? false;
      const tierInfo = getTier(contestRating, isRated);
      return {
        _id: s._id,
        username: s.userId?.username || 'Guest',
        userColor: tierInfo?.colorHex || '#888888',
        problemTitle: s.problemId?.title || 'Unknown Problem',
        problemSlug: s.problemId?.slug || '',
        verdict: s.verdict,
        language: s.language,
        submittedAt: s.submittedAt
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { runCode, submitCode, getUserProblemSubmissions, getRecentSubmissions }