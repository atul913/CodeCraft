/**
 * utils/ratingSystem.js
 *
 * Implements a simplified Elo-MMR style rating for competitive programming.
 *
 * ALGORITHM OVERVIEW
 * ──────────────────
 * Based on Elo-MMR (Ebtekar & Liu, WWW 2021) adapted for online judges.
 *
 * Key properties:
 *  - Newcomers start at 1500 with high uncertainty (shown as "?" for first 2 contests)
 *  - K-factor shrinks as player accumulates more contests → stability over time
 *  - Expected rank computed via logistic pairwise comparisons across all contestants
 *  - Rating delta = K * (expectedRank - actualRank) / totalContestants * scaleFactor
 *  - Soft floor: rating can't fall below 800 for active users
 *  - Problem rating uses additive point system with difficulty weights
 */

const INITIAL_RATING   = 1500;
const MIN_RATING       = 0;
const ACTIVE_FLOOR     = 800;
const UNRATED_CONTESTS = 2;        // first N contests don't affect displayed rating

/**
 * Compute K-factor: starts high for newcomers, decays as experience grows.
 * K = 800 / (n + 400)  where n = contestsPlayed before this contest
 */
function getKFactor(contestsPlayed) {
  return 800 / (contestsPlayed + 400);
}

/**
 * Expected win probability of player A over player B using logistic model.
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Compute expected rank in a contest given list of all participant ratings.
 * expectedRank = 1 + Σ P(player_j beats player_i) for all j ≠ i
 *
 * @param {number} myRating - rating of the player
 * @param {number[]} allRatings - array of all contest participant ratings
 * @returns {number} expected rank (1-indexed, float)
 */
function expectedRank(myRating, allRatings) {
  let rank = 1;
  for (const r of allRatings) {
    if (r !== myRating) {
      rank += expectedScore(r, myRating);    // probability that opponent beats me
    }
  }
  return rank;
}

/**
 * Main function: compute rating delta for a single player after a contest.
 *
 * @param {object} params
 * @param {number} params.rating          - current rating before contest
 * @param {number} params.contestsPlayed  - total contests played before this one
 * @param {number} params.actualRank      - actual rank achieved (1 = best)
 * @param {number[]} params.allRatings    - ratings of ALL participants (including self)
 * @returns {{ ratingAfter: number, delta: number }}
 */
function computeContestDelta({ rating, contestsPlayed, actualRank, allRatings }) {
  const n  = allRatings.length;
  const K  = getKFactor(contestsPlayed);
  const eR = expectedRank(rating, allRatings);

  // Positive delta if we beat expectations, negative if we underperformed
  const delta = Math.round(K * (eR - actualRank) / n * 100);

  let ratingAfter = rating + delta;

  // Soft floor enforcement
  if (ratingAfter < ACTIVE_FLOOR && contestsPlayed >= 5) {
    // Slow approach to floor: never drops more than halfway to floor in one contest
    ratingAfter = Math.max(ACTIVE_FLOOR, Math.floor(rating + delta * 0.5));
  }
  ratingAfter = Math.max(MIN_RATING, ratingAfter);

  return { ratingAfter, delta: ratingAfter - rating };
}

/**
 * Problem rating delta based on difficulty.
 * Called when a user successfully solves a problem.
 *
 * @param {string} difficulty - 'Easy' | 'Medium' | 'Hard'
 * @param {number} wrongAttempts - number of wrong submissions before AC
 * @returns {number} points to add to problemRating
 */
function problemDelta(difficulty, wrongAttempts = 0) {
  const base = { Easy: 3, Medium: 8, Hard: 20 }[difficulty] || 3;
  const penalty = Math.min(wrongAttempts, 5);       // cap penalty at 5 WA
  return Math.max(1, base - penalty);
}

/**
 * Compute global composite score.
 * globalScore = 0.6 * contestRating + 0.3 * problemRating + 0.1 * (reputation * 5)
 */
function globalScore(contestRating, problemRating, reputation) {
  return Math.round(
    0.6 * (contestRating || INITIAL_RATING) +
    0.3 * (problemRating || 0) +
    0.1 * ((reputation || 0) * 5)
  );
}

/**
 * Determine user tier from contest rating.
 * Returns { name, colorHex, colorClass }
 */
function getTier(contestRating, isRated) {
  if (!isRated) return { name: 'Unrated', colorHex: '#888888', colorClass: 'tier-unrated' };
  const r = contestRating;
  if (r >= 3000) return { name: 'Legendary Grandmaster', colorHex: '#FF0000',  colorClass: 'tier-lgm' };
  if (r >= 2600) return { name: 'Intl. Grandmaster',     colorHex: '#FF3333',  colorClass: 'tier-igm' };
  if (r >= 2400) return { name: 'Grandmaster',           colorHex: '#FF3333',  colorClass: 'tier-gm' };
  if (r >= 2300) return { name: 'Intl. Master',          colorHex: '#FF8C00',  colorClass: 'tier-im' };
  if (r >= 2100) return { name: 'Master',                colorHex: '#FF8C00',  colorClass: 'tier-master' };
  if (r >= 1900) return { name: 'Candidate Master',      colorHex: '#AA00AA',  colorClass: 'tier-cm' };
  if (r >= 1600) return { name: 'Expert',                colorHex: '#0000FF',  colorClass: 'tier-expert' };
  if (r >= 1400) return { name: 'Specialist',            colorHex: '#03A89E',  colorClass: 'tier-specialist' };
  if (r >= 1200) return { name: 'Pupil',                 colorHex: '#008000',  colorClass: 'tier-pupil' };
  return             { name: 'Newbie',                   colorHex: '#808080',  colorClass: 'tier-newbie' };
}

module.exports = {
  INITIAL_RATING,
  UNRATED_CONTESTS,
  computeContestDelta,
  problemDelta,
  globalScore,
  getTier,
  getKFactor,
  expectedRank
};