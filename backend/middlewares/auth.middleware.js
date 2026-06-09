const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]  // Bearer <token>

  if (!token)
    return res.status(401).json({ success: false, message: 'Login required' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, username, role }
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

module.exports = verifyToken