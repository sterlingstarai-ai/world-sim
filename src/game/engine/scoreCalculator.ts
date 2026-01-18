import { NationStats, ScoreWeights, DEFAULT_SCORE_WEIGHTS } from '@/types/game';

/**
 * Calculate score for a single turn
 * Score is based on weighted sum of normalized stats
 */
export function calculateTurnScore(
  stats: NationStats,
  turn: number,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): number {
  // Normalize GDP (assuming max ~1000 for normalization)
  const normalizedGdp = Math.min(stats.gdp / 1000, 1) * 100;

  // Survival bonus (increases with turns survived)
  const survivalBonus = Math.min(turn / 30, 1) * 100;

  // Calculate weighted score
  const rawScore =
    normalizedGdp * weights.gdp +
    stats.happiness * weights.happiness +
    stats.techLevel * weights.techLevel +
    stats.military * weights.military +
    stats.diplomacy * weights.diplomacy +
    survivalBonus * weights.survival;

  return Math.round(rawScore);
}

/**
 * Calculate score change between turns
 */
export function calculateScoreChange(
  previousStats: NationStats,
  newStats: NationStats,
  previousTurn: number,
  newTurn: number,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): number {
  const previousScore = calculateTurnScore(previousStats, previousTurn, weights);
  const newScore = calculateTurnScore(newStats, newTurn, weights);

  return newScore - previousScore;
}

/**
 * Calculate bonus score for achievements/milestones
 */
export function calculateBonusScore(
  stats: NationStats,
  previousStats: NationStats
): number {
  let bonus = 0;

  // GDP milestone bonuses
  const gdpMilestones = [200, 300, 500, 750, 1000];
  for (const milestone of gdpMilestones) {
    if (stats.gdp >= milestone && previousStats.gdp < milestone) {
      bonus += 50; // Bonus for reaching GDP milestone
    }
  }

  // Perfect happiness bonus
  if (stats.happiness >= 90 && previousStats.happiness < 90) {
    bonus += 30;
  }

  // Tech leader bonus
  if (stats.techLevel >= 80 && previousStats.techLevel < 80) {
    bonus += 40;
  }

  // Military power bonus
  if (stats.military >= 80 && previousStats.military < 80) {
    bonus += 30;
  }

  // Diplomatic mastery bonus
  if (stats.diplomacy >= 80 && previousStats.diplomacy < 80) {
    bonus += 30;
  }

  // Balanced nation bonus (all stats > 50)
  const allStatsAbove50 =
    stats.industry > 50 &&
    stats.techLevel > 50 &&
    stats.military > 50 &&
    stats.happiness > 50 &&
    stats.diplomacy > 50;
  const previouslyBalanced =
    previousStats.industry > 50 &&
    previousStats.techLevel > 50 &&
    previousStats.military > 50 &&
    previousStats.happiness > 50 &&
    previousStats.diplomacy > 50;

  if (allStatsAbove50 && !previouslyBalanced) {
    bonus += 100;
  }

  return bonus;
}

/**
 * Check for game over conditions (score penalties/loss)
 */
export function checkGameOverConditions(stats: NationStats): {
  isGameOver: boolean;
  reason?: string;
} {
  // Bankruptcy
  if (stats.gdp <= 0) {
    return { isGameOver: true, reason: '경제 파탄 (GDP 0)' };
  }

  // Revolution (extremely low happiness)
  if (stats.happiness <= 0) {
    return { isGameOver: true, reason: '혁명 발생 (행복도 0)' };
  }

  // Population collapse
  if (stats.population <= 0) {
    return { isGameOver: true, reason: '인구 소멸' };
  }

  // Conquered (no military and low diplomacy)
  if (stats.military <= 0 && stats.diplomacy < 20) {
    return { isGameOver: true, reason: '침략당함 (군사력 0, 외교력 부족)' };
  }

  return { isGameOver: false };
}

/**
 * Calculate final score with all bonuses and penalties
 */
export function calculateFinalScore(
  stats: NationStats,
  previousStats: NationStats,
  previousScore: number,
  turn: number,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): { newScore: number; scoreChange: number; bonusScore: number } {
  // Calculate base score change
  const baseScoreChange = calculateScoreChange(
    previousStats,
    stats,
    turn - 1,
    turn,
    weights
  );

  // Calculate bonus score
  const bonusScore = calculateBonusScore(stats, previousStats);

  // Total score change
  const scoreChange = baseScoreChange + bonusScore;

  // New total score
  const newScore = previousScore + scoreChange;

  return { newScore, scoreChange, bonusScore };
}
