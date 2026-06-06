const express = require('express')
const router  = express.Router()
const { getProblems, getProblemBySlug } = require('../controllers/problem.controller')

router.get('/', getProblems)
router.get('/:slug', getProblemBySlug)

module.exports = router