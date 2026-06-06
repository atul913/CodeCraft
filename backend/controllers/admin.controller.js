const Problem = require('../models/problem')

// POST /api/admin/problems
const createProblem = async (req, res) => {
  try {
    const {
      title, difficulty, categories, tags,
      description, constraints,
      visibleTestCases, hiddenTestCases,
      supportedLanguages, starterCode, solutionTemplates,
      timeLimit, memoryLimit, editorial
    } = req.body

    // generate slug from title
    const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // check if slug already exists
    const existing = await Problem.findOne({ slug })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Problem with this title already exists' })
    }

    const problem = new Problem({
      slug, title, difficulty,
      categories: categories || [],
      tags: tags || [],
      description,
      constraints: constraints || [],
      visibleTestCases: visibleTestCases || [],
      hiddenTestCases: hiddenTestCases || [],
      supportedLanguages: supportedLanguages || [],
      starterCode: starterCode || {},
      solutionTemplates: solutionTemplates || {},
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 256,
      editorial: editorial || {}
    })

    await problem.save()

    await function () {
      console.log("Problem Created")
    }

    res.status(201).json({ success: true, message: 'Problem created', data: problem })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/admin/problems
const getProblems = async (req, res) => {
  console.log("getting problems")
  try {
    const problems = await Problem.find().select('title slug difficulty categories isActive createdAt').sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: problems })
  } catch (error) {
    console.log("error came by say hi\n");
    res.status(500).json({ success: false, message: error.message })
  }

}

const updateProblemBySlug = async (req, res) => {
  try {
    console.log('updated')
    const {
      title, difficulty, categories, tags,
      description, constraints,
      visibleTestCases, hiddenTestCases,
      supportedLanguages, starterCode, solutionTemplates,
      timeLimit, memoryLimit, editorial
    } = req.body;

    // Use findOneAndUpdate when matching by slug or any field other than _id
    const updatedProblem = await Problem.findOneAndUpdate(
      { slug: req.params.slug }, // 1. Match condition
      {                          // 2. Data payload to update
        title,
        difficulty,
        categories,
        tags,
        description,
        constraints,
        visibleTestCases,
        hiddenTestCases,
        supportedLanguages,
        starterCode,
        solutionTemplates,
        timeLimit,
        memoryLimit,
        editorial
      },
      { new: true, runValidators: true } // 3. Options: returns updated doc & runs schema checks
    );

    // If no problem matched the slug
    if (!updatedProblem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Problem updated successfully', 
      data: updatedProblem 
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);

    res.status(500).json({
        success: false,
        message: error.message
    });
}
}

const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug, isActive: true })
      .select('-hiddenTestCases -solutionTemplates')
      console.log('Found')
      // never send hidden test cases or solution templates to frontend

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' })
    }

    res.status(200).json({ success: true, data: problem })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


module.exports = { createProblem, getProblems, getProblemBySlug, updateProblemBySlug }
