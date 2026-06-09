const { Schema, model } = require('mongoose');

/**
 * RATING SYSTEM DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 * We maintain THREE distinct rating tracks, each measuring different skills:
 *
 * 1. contestRating  — Elo-MMR inspired, updated after each rated contest.
 *    - New users start at 1500 (unrated shown as "?" until 2 contests).
 *    - K-factor = 800/(contestsPlayed + 400) so early ratings move fast.
 *    - Each contest: expected rank vs actual rank → delta applied.
 *    - Never drops below 0; strong floor at 800 for active users.
 *
 * 2. problemRating  — Weighted by difficulty + topic tags solved.
 *    - Easy = +3, Medium = +8, Hard = +20 points per accepted solve.
 *    - Penalty for wrong submissions: -1 per WA (capped at -5 per problem).
 *    - Decays slowly if user is inactive > 90 days.
 *
 * 3. globalScore    — Composite leaderboard score.
 *    = 0.6 * contestRating + 0.3 * problemRating + 0.1 * (reputation * 5)
 *    Used for overall leaderboard rankings.
 *
 * RANK TIERS (by contestRating, mirrors Codeforces color system):
 *   < 1200  → Newbie        (gray)
 *   1200–   → Pupil         (green)
 *   1400–   → Specialist    (teal)
 *   1600–   → Expert        (blue)
 *   1900–   → Candidate Master (violet)
 *   2100–   → Master        (orange)
 *   2300–   → International Master (orange)
 *   2400–   → Grandmaster   (red)
 *   2600–   → International Grandmaster (red)
 *   3000+   → Legendary Grandmaster (red + crown)
 */

const contestParticipationSchema = new Schema({
  contest:      { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
  rank:         { type: Number, required: true },
  ratingBefore: { type: Number, required: true },
  ratingAfter:  { type: Number, required: true },
  ratingDelta:  { type: Number, required: true },
  score:        { type: Number, default: 0 },
  penalty:      { type: Number, default: 0 },
  problemsSolved: { type: Number, default: 0 },
  participatedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['student', 'instructor', 'enterprise', 'admin'], default: 'student' },

  profile: {
    name:        { type: String, default: '' },
    bio:         { type: String, default: '' },
    avatarUrl:   { type: String, default: '' },
    country:     { type: String, default: '' },
    organization:{ type: String, default: '' },
    website:     { type: String, default: '' },
    socials: {
      github:    { type: String, default: '' },
      linkedin:  { type: String, default: '' },
      twitter:   { type: String, default: '' },
      codeforces:{ type: String, default: '' },
      leetcode:  { type: String, default: '' }
    }
  },

  rating: {
    contest:        { type: Number, default: 1500 },
    contestPeak:    { type: Number, default: 1500 },
    problem:        { type: Number, default: 0 },
    global:         { type: Number, default: 900 },
    isRated:        { type: Boolean, default: false },      // true after 2 contests
    contestsPlayed: { type: Number, default: 0 },
    history: [contestParticipationSchema]
  },

  stats: {
    problemsSolved:   { type: Number, default: 0 },
    easySolved:       { type: Number, default: 0 },
    mediumSolved:     { type: Number, default: 0 },
    hardSolved:       { type: Number, default: 0 },
    submissionsCount: { type: Number, default: 0 },
    acceptedCount:    { type: Number, default: 0 },
    reputation:       { type: Number, default: 0 },
    streak:           { type: Number, default: 0 },
    maxStreak:        { type: Number, default: 0 },
    totalActiveDays:  { type: Number, default: 0 },
    lastActiveDate:   { type: Date },
    activityMap:      { type: Map, of: Number, default: {} },  // "YYYY-MM-DD" -> submissionCount
    tagStats:         { type: Map, of: Number, default: {} }   // "dp" -> solvedCount
  },

  solvedProblems:     [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  bookmarkedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],

  lastLoginAt: { type: Date },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

/**
 * Virtual: tier info derived from contestRating
 */
userSchema.virtual('tier').get(function () {
  const r = this.rating.contest;
  if (!this.rating.isRated) return { name: 'Unrated', color: '#888888', colorName: 'gray' };
  if (r >= 3000) return { name: 'Legendary Grandmaster', color: '#FF0000', colorName: 'red' };
  if (r >= 2600) return { name: 'International Grandmaster', color: '#FF3333', colorName: 'red' };
  if (r >= 2400) return { name: 'Grandmaster', color: '#FF3333', colorName: 'red' };
  if (r >= 2300) return { name: 'International Master', color: '#FF8C00', colorName: 'orange' };
  if (r >= 2100) return { name: 'Master', color: '#FF8C00', colorName: 'orange' };
  if (r >= 1900) return { name: 'Candidate Master', color: '#AA00AA', colorName: 'violet' };
  if (r >= 1600) return { name: 'Expert', color: '#0000FF', colorName: 'blue' };
  if (r >= 1400) return { name: 'Specialist', color: '#03A89E', colorName: 'teal' };
  if (r >= 1200) return { name: 'Pupil', color: '#008000', colorName: 'green' };
  return { name: 'Newbie', color: '#808080', colorName: 'gray' };
});

/**
 * Helper: compute globalScore from current stats
 */
userSchema.methods.computeGlobalScore = function () {
  const c = this.rating.contest || 1500;
  const p = this.rating.problem || 0;
  const r = this.stats.reputation || 0;
  return Math.round(0.6 * c + 0.3 * p + 0.1 * (r * 5));
};

module.exports = model('User', userSchema);