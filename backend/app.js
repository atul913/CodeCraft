const express = require('express')
const dotenv  = require('dotenv')
const path    = require('path')

dotenv.config()

const adminRoutes = require('./routes/admin.routes')
const problemRoutes = require('./routes/problem.routes')
const authRoutes = require('./routes/auth.routes')
const submissionRoutes = require('./routes/submission.routes')
const userRoutes = require('./routes/user.routes')
const leaderboardRoutes = require('./routes/leaderboard.routes')
const commentRoutes = require('./routes/comment.routes')

const app = express()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// ── Middleware ──
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Static files (css, js, images) ──
app.use(express.static(path.join(__dirname, '../frontend/assets')))

// ── API Routes ──
app.use('/api/admin', adminRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/comments', commentRoutes)

// ── Page Routes ──
app.get('/', (req, res) => {
  res.render('index', { pageTitle: "CodeCraft - Home" });
})

// route index.html
app.get('/login', (req, res) => {
  res.render('login', {pageTitle:"CodeCraft - Login", googleClientId: process.env.GOOGLE_CLIENT_ID || ''});
})

// route index.html
app.get('/register', (req, res) => {
  res.render('register', {pageTitle:"CodeCraft - Register", googleClientId: process.env.GOOGLE_CLIENT_ID || ''});
})

// route index.html
app.get('/problems', (req, res) => {
  res.render('problems-list', {pageTitle:"CodeCraft - Problems"});
})

// route for problem.html
app.get('/problems/:slug', (req, res) => {
  res.render('problem', {pageTitle:"CodeCraft - Problem"});
})

app.get('/profile', (req, res) => {
  res.render('profile', {pageTitle:"CodeCraft - Profile"});
})

app.get('/profile/:username', (req, res) => {
  res.render('profile', {pageTitle:"CodeCraft - Profile"});
})

app.get('/ratings', (req, res) => {
  res.render('ratings',  {pageTitle:"CodeCraft - Ratings"})
})

// route for admin / problem-form.html
app.get('/admin/problems/new', (req, res) => {
  res.render('admin/problem-form');
})

// route for admin / problems-list.html
app.get('/admin/problems', (req, res) => {
  res.render('admin/problems-list');
})

// route for admin / problems-list.html
app.get('/admin/problem/edit/:slug', (req, res) => {
  res.render('admin/edit-problem');
})

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

module.exports = app