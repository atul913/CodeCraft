const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const crypto = require('crypto')

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
    console.log('Login attempt:', req.body)

    if (!handle || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' })

    // handle can be username or email
    const user = await User.findOne({
      $or: [
        { username: handle.toLowerCase() },
        { email:    handle.toLowerCase() }
      ]
    })

    if (!user){
      console.log('User not found for handle:', handle)
      return res.status(400).json({ success: false, message: 'Invalid handle or password' })
    }

    if (!user.isActive){
      return res.status(403).json({ success: false, message: 'Account is disabled' })
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch){
      console.log('Invalid password for handle:', handle)
      return res.status(400).json({ success: false, message: 'Invalid handle or password' })
    }
    // update last login
    console.log('Login successful for user:', user.username)
    user.lastLoginAt = new Date()
    await user.save()

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    )

    const refreshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'),
      { expiresIn: '7d' }
    )

    user.refreshToken = refreshToken
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
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

// Helper: Generate unique username based on name or email
const generateUniqueUsername = async (name, email) => {
  let baseUsername = '';
  if (name) {
    baseUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  } else if (email) {
    baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  } else {
    baseUsername = 'user';
  }

  // Clean duplicate/leading/trailing underscores
  baseUsername = baseUsername.replace(/__+/g, '_').replace(/^_+|_+$/g, '');

  if (!baseUsername || baseUsername.length < 3) {
    baseUsername = 'user';
  }

  // Limit username length to leave room for suffix
  baseUsername = baseUsername.substring(0, 15);

  let username = baseUsername;
  let exists = await User.findOne({ username });
  let suffix = 1;
  while (exists) {
    username = `${baseUsername}_${suffix}`;
    exists = await User.findOne({ username });
    suffix++;
  }
  return username;
}

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { accessToken } = req.body
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required' })
    }

    // Verify token & get user info from Google API
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!googleRes.ok) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' })
    }

    const googleUser = await googleRes.json()
    const { email, name, picture } = googleUser

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not provided by Google account' })
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Create new user
      const username = await generateUniqueUsername(name, email)

      // Generate a secure random password since it is required in Mongoose Schema
      const randomPassword = crypto.randomBytes(32).toString('hex')
      const passwordHash = await bcrypt.hash(randomPassword, 10)

      user = new User({
        username,
        email: email.toLowerCase(),
        passwordHash,
        profile: {
          name: name || '',
          avatarUrl: picture || ''
        }
      })

      await user.save()
    } else {
      // Existing user: update avatar if not present, and last login
      if (picture && !user.profile.avatarUrl) {
        user.profile.avatarUrl = picture
      }
      user.lastLoginAt = new Date()
      await user.save()
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' })
    }

    // Generate JWT Access & Refresh
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    )

    const refreshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'),
      { expiresIn: '7d' }
    )

    user.refreshToken = refreshToken
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
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

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' })
    }

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'))
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
    }

    const user = await User.findOne({ _id: decoded.id, refreshToken })
    if (!user) {
      return res.status(403).json({ success: false, message: 'Refresh token is invalid or has been revoked' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' })
    }

    // Rotate tokens
    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    )

    const newRefreshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'),
      { expiresIn: '7d' }
    )

    user.refreshToken = newRefreshToken
    await user.save()

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      const user = await User.findOne({ refreshToken })
      if (user) {
        user.refreshToken = ''
        await user.save()
      }
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { register, login, googleAuth, refresh, logout }