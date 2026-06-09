const express = require('express')
const router  = express.Router()
const { register, login, googleAuth, refresh, logout } = require('../controllers/auth.controller')

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.post('/refresh', refresh)
router.post('/logout', logout)

module.exports = router