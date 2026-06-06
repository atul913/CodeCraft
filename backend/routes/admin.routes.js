const express = require('express')
const router = express.Router()
const { createProblem, getProblems, getProblemBySlug, updateProblemBySlug } = require('../controllers/admin.controller')


router.post('/problems', createProblem)
router.get('/problems', getProblems)
router.get('/problems/:slug', getProblemBySlug)
router.put('/problems/:slug', updateProblemBySlug)

module.exports = router