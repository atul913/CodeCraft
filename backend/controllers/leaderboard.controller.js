/**
 * controllers/leaderboard.controller.js
 *
 * GET /api/leaderboard
 * Returns all active users with the fields needed for every rating tab.
 * Sorted by contestRating desc by default (frontend re-sorts per tab).
 *
 * Lean query — no population needed; all data is denormalized on User.
 */

const User = require('../models/user')
const { getTier } = require('../utils/ratingSystem')

const getLeaderboard = async (req, res) => {
  try {
    const users = await User
      .find({ isActive: true })
      .select([
        'username',
        'profile.name',
        'profile.avatarUrl',
        'profile.country',
        'role',
        'rating.contest',
        'rating.contestPeak',
        'rating.problem',
        'rating.global',
        'rating.isRated',
        'rating.contestsPlayed',
        'stats.problemsSolved',
        'stats.easySolved',
        'stats.mediumSolved',
        'stats.hardSolved',
        'stats.submissionsCount',
        'stats.acceptedCount',
        'stats.reputation',
        'stats.streak'
      ].join(' '))
      .lean()   // lean query
      .sort({ 'rating.contest': -1 })

    const data = users.map(u => ({
      username:       u.username,
      name:           u.profile?.name        || '',
      avatarUrl:      u.profile?.avatarUrl   || '',
      country:        u.profile?.country     || '',
      role:           u.role,

      // Contest rating track
      contestRating:  u.rating?.contest      ?? 1500,
      peakRating:     u.rating?.contestPeak  ?? u.rating?.contest ?? 1500,
      problemRating:  u.rating?.problem      ?? 0,
      globalScore:    u.rating?.global       ?? 0,
      isRated:        u.rating?.isRated      ?? false,
      contestsPlayed: u.rating?.contestsPlayed ?? 0,

      // Problem stats
      problemsSolved: u.stats?.problemsSolved  ?? 0,
      easySolved:     u.stats?.easySolved      ?? 0,
      mediumSolved:   u.stats?.mediumSolved    ?? 0,
      hardSolved:     u.stats?.hardSolved      ?? 0,
      submissionsCount: u.stats?.submissionsCount ?? 0,
      acceptedCount:  u.stats?.acceptedCount   ?? 0,
      reputation:     u.stats?.reputation      ?? 0,
      streak:         u.stats?.streak          ?? 0,

      // Derived
      acRate:         u.stats?.submissionsCount > 0
                        ? Math.round((u.stats.acceptedCount ?? u.stats.problemsSolved) / u.stats.submissionsCount * 100)
                        : 0,

      // Tier virtual (name + colorHex)
      tier:           getTier(u.rating?.contest ?? 1500, u.rating?.isRated ?? false)
    }))

    res.json({ success: true, data })
  } catch (err) {
    console.error('[getLeaderboard]', err)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getLeaderboard }


// ─────────────────────────────────────────────────────────────
// routes/leaderboard.routes.js  (paste into its own file)
// ─────────────────────────────────────────────────────────────
//
// const express = require('express')
// const router  = express.Router()
// const { getLeaderboard } = require('../controllers/leaderboard.controller')
//
// router.get('/', getLeaderboard)
//
// module.exports = router
//
// ── In app.js ──
// app.use('/api/leaderboard', require('./routes/leaderboard.routes'))