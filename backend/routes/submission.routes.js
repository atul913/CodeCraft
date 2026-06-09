const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middlewares/auth.middleware')
const { runCode, submitCode, getUserProblemSubmissions, getRecentSubmissions } = require('../controllers/submission.controller')

router.get('/recent', getRecentSubmissions)
router.get('/problem/:problemId', verifyToken, getUserProblemSubmissions)
router.post('/run',    verifyToken, runCode)
router.post('/submit', verifyToken, submitCode)

module.exports = router