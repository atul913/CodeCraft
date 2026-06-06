const Problem = require('../models/Problem')

// GET /api/problems
const getProblems = async (req, res) => {
  try {
    const { difficulty, category, search } = req.query

    const filter = { isActive: true }

    if (difficulty) filter.difficulty = difficulty
    if (category)   filter.categories = category
    if (search)     filter.title = { $regex: search, $options: 'i' }

    const problems = await Problem.find(filter)
      .select('title slug difficulty categories tags isActive createdAt')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, data: problems })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/problems/:slug
const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug, isActive: true })
      .select('-hiddenTestCases -solutionTemplates')
      // never send hidden test cases or solution templates to frontend

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' })
    }

    res.status(200).json({ success: true, data: problem })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getProblems, getProblemBySlug }