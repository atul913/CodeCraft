const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' })

    if (password.length < 5)
      return res.status(400).json({ success: false, message: 'Password must be at least 5 characters' })

    if (!/^[A-Za-z0-9_]+$/.test(username))
      return res.status(400).json({ success: false, message: 'Handle can only contain letters, numbers, and underscores' })

    const existingUser  = await User.findOne({ username })
    const existingEmail = await User.findOne({ email })

    if (existingUser)  return res.status(400).json({ success: false, message: 'Handle already taken' })
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)

    const user = new User({
      username: username.toLowerCase(),
      email:    email.toLowerCase(),
      passwordHash
    })

    await user.save()

    res.status(201).json({ success: true, message: 'Registration successful' })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { handle, password } = req.body

    if (!handle || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' })

    // handle can be username or email
    const user = await User.findOne({
      $or: [
        { username: handle.toLowerCase() },
        { email:    handle.toLowerCase() }
      ]
    })

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid handle or password' })

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account is disabled' })

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid handle or password' })

    // update last login
    user.lastLoginAt = new Date()
    await user.save()

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role
      }
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { register, login }