const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { getUserProfile, updateUserProfile } = require('../controllers/user.controller')
const verifyToken = require('../middlewares/auth.middleware')

// Middleware to optionally decode token if it exists (allows public viewing with owner detection)
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
    } catch (err) {
      // Ignore invalid or expired tokens for optional auth
    }
  }
  next()
}

router.get('/:username', optionalVerifyToken, getUserProfile)
router.put('/:username', verifyToken, updateUserProfile)

module.exports = router
