const User = require('../models/user')
const { getTier } = require('../utils/ratingSystem')

// Safely convert Map or plain object → plain JS object
// .lean({ virtuals: true }) can return either depending on Mongoose version
function toPlainObject(val) {
  if (!val) return {}
  if (val instanceof Map) return Object.fromEntries(val)
  if (typeof val === 'object') return val
  return {}
}

// ─────────────────────────────────────────────────────────────
// GET /api/users/:username
// Public — attaches isOwnProfile when token is present
// ─────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase()

    const user = await User
      .findOne({ username, isActive: true })
      .populate('solvedProblems', 'title slug difficulty tags')
      .lean({ virtuals: true })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    // JWT payload is { id, username, role } — set by verifyToken / optionalVerifyToken
    const isOwnProfile = !!(req.user && req.user.id === user._id.toString())

    const payload = {
      _id:      user._id,
      username: user.username,
      role:     user.role,
      profile:  user.profile,
      rating: {
        ...user.rating,
        history: user.rating?.history || []
      },
      stats: {
        ...user.stats,
        activityMap: toPlainObject(user.stats?.activityMap),
        tagStats:    toPlainObject(user.stats?.tagStats)
      },
      tier:           getTier(user.rating?.contest ?? 1500, user.rating?.isRated ?? false),          // computed using helper
      solvedProblems: user.solvedProblems || [],
      createdAt:      user.createdAt,
      lastLoginAt:    user.lastLoginAt,
      isOwnProfile
    }

    // Email only visible to the owner
    if (isOwnProfile) {
      payload.email = user.email
    }

    res.json({ success: true, data: payload })
  } catch (err) {
    console.error('[getUserProfile]', err)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:username
// Requires auth — only the profile owner can update
// ─────────────────────────────────────────────────────────────
const updateUserProfile = async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase()

    // JWT payload has username — compare directly
    if (req.user.username !== username) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this profile.' })
    }

    const { name, bio, avatarUrl, country, organization, website, socials } = req.body

    const updated = await User.findOneAndUpdate(
      { username },
      {
        $set: {
          'profile.name':               name             ?? '',
          'profile.bio':                bio              ?? '',
          'profile.avatarUrl':          avatarUrl        ?? '',
          'profile.country':            country          ?? '',
          'profile.organization':       organization     ?? '',
          'profile.website':            website          ?? '',
          'profile.socials.github':     socials?.github     ?? '',
          'profile.socials.linkedin':   socials?.linkedin   ?? '',
          'profile.socials.twitter':    socials?.twitter    ?? '',
          'profile.socials.codeforces': socials?.codeforces ?? '',
          'profile.socials.leetcode':   socials?.leetcode   ?? ''
        }
      },
      { new: true, runValidators: true }
    ).lean()

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    res.json({ success: true, message: 'Profile updated.', data: { profile: updated.profile } })
  } catch (err) {
    console.error('[updateUserProfile]', err)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getUserProfile, updateUserProfile }