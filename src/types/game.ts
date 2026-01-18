// Game Types for World Sim
// Based on GDD v0.2 and ERD v0.2

// ==================== ENUMS ====================

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type SeasonStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED';
export type Direction = 'INDUSTRY' | 'FINANCE' | 'MILITARY' | 'TECH';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';
export type UGCStatus = 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'HIDDEN' | 'BANNED';
export type PolicyCategory = 'ECONOMY' | 'WELFARE' | 'TECH' | 'MILITARY' | 'DIPLOMACY' | 'RISK';
export type EventCategory = 'ECONOMY' | 'MILITARY' | 'TECH' | 'SOCIAL' | 'DIPLOMACY';
export type LeaderboardType = 'DAILY' | 'WEEKLY' | 'SEASON' | 'CATEGORY';

// ==================== NATION STATS ====================

export interface NationStats {
  // 경제 (Economy)
  gdp: number;           // GDP (0-1000)
  industry: number;      // 산업력 (0-100)
  resources: number;     // 자원 (0-100)

  // 기술 (Technology)
  techLevel: number;     // 기술 레벨 (0-100)
  research: number;      // 연구 생산량 (0-100)

  // 군사 (Military)
  military: number;      // 군사력 (0-100)

  // 사회 (Social)
  population: number;    // 인구 (millions)
  happiness: number;     // 행복도 (0-100)

  // 외교 (Diplomacy)
  diplomacy: number;     // 외교력 (0-100)
}

export const DEFAULT_STATS: NationStats = {
  gdp: 100,
  industry: 50,
  resources: 50,
  techLevel: 30,
  research: 30,
  military: 30,
  population: 50,
  happiness: 50,
  diplomacy: 50,
};

// Direction bonuses
export const DIRECTION_BONUSES: Record<Direction, Partial<NationStats>> = {
  INDUSTRY: { industry: 20, resources: 10 },
  FINANCE: { gdp: 50, diplomacy: 10 },
  MILITARY: { military: 20, industry: 10 },
  TECH: { techLevel: 15, research: 20 },
};

// ==================== BUDGET ====================

export interface Budget {
  economy: number;     // 0-100 (%)
  welfare: number;     // 0-100 (%)
  research: number;    // 0-100 (%)
  military: number;    // 0-100 (%)
  diplomacy: number;   // 0-100 (%)
}

export const DEFAULT_BUDGET: Budget = {
  economy: 20,
  welfare: 20,
  research: 20,
  military: 20,
  diplomacy: 20,
};

// Validate budget sums to 100
export function validateBudget(budget: Budget): boolean {
  const total = budget.economy + budget.welfare + budget.research + budget.military + budget.diplomacy;
  return Math.abs(total - 100) < 0.01;
}

// ==================== TURN DECISION ====================

export interface TurnDecisionInput {
  budget: Budget;
  activePolicies: string[];      // Policy card IDs
  diplomacyActions?: DiplomacyAction[];
}

export interface DiplomacyAction {
  type: 'TRADE_AGREEMENT' | 'ALLIANCE' | 'SANCTION' | 'AID';
  targetNation?: string;
  amount?: number;
}

// ==================== EVENTS ====================

export interface EventTrigger {
  type: 'STAT_THRESHOLD' | 'TURN_NUMBER' | 'RANDOM' | 'POLICY_ACTIVE';
  stat?: keyof NationStats;
  operator?: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE';
  value?: number;
  probability?: number;      // 0-1 for random events
  policyId?: string;
}

export interface EventEffect {
  stat: keyof NationStats;
  type: 'ADD' | 'MULTIPLY' | 'SET';
  value: number;
}

export interface EventDefinitionData {
  id: string;
  name: string;
  category: EventCategory;
  triggers: EventTrigger[];
  effects: EventEffect[];
  duration: number;          // 0 = instant, > 0 = lasting turns
}

// ==================== POLICY CARDS ====================

export interface PolicyEffect {
  stat: keyof NationStats;
  type: 'ADD' | 'MULTIPLY';
  value: number;
}

export interface PolicyCondition {
  stat: keyof NationStats;
  operator: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE';
  value: number;
}

export interface PolicyCardData {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  effects: PolicyEffect[];
  conditions?: PolicyCondition[];
}

// ==================== CHALLENGES ====================

export interface ChallengeConstraint {
  type: 'STAT_LIMIT' | 'BUDGET_LOCK' | 'POLICY_REQUIRED' | 'POLICY_BANNED';
  stat?: keyof NationStats;
  budgetCategory?: keyof Budget;
  operator?: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE';
  value?: number;
  policyId?: string;
}

export interface WinCondition {
  type: 'STAT_TARGET' | 'SURVIVE_TURNS' | 'SCORE_TARGET';
  stat?: keyof NationStats;
  operator?: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE';
  value: number;
}

export interface ChallengeData {
  id: string;
  title: string;
  description?: string;
  startNationTemplate: string;
  constraints: ChallengeConstraint[];
  winConditions: WinCondition[];
  turnLimit: number;
  difficulty: Difficulty;
}

// ==================== SCORE CALCULATION ====================

export interface ScoreWeights {
  gdp: number;
  happiness: number;
  techLevel: number;
  military: number;
  diplomacy: number;
  survival: number;    // Bonus for surviving turns
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  gdp: 0.25,
  happiness: 0.20,
  techLevel: 0.20,
  military: 0.15,
  diplomacy: 0.10,
  survival: 0.10,
};

// Score formula: weighted sum of normalized stats
export function calculateScore(stats: NationStats, turn: number, weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS): number {
  const normalizedGdp = Math.min(stats.gdp / 1000, 1) * 100;
  const survivalBonus = Math.min(turn / 30, 1) * 100;

  return Math.round(
    normalizedGdp * weights.gdp +
    stats.happiness * weights.happiness +
    stats.techLevel * weights.techLevel +
    stats.military * weights.military +
    stats.diplomacy * weights.diplomacy +
    survivalBonus * weights.survival
  );
}

// ==================== LEADERBOARD ====================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  score: number;
  sessionId: string;
  nationTemplate: string;
  direction: Direction;
}

export interface LeaderboardRankings {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  updatedAt: string;
}

// ==================== MAP SEED ====================

export type ResourceRichness = 'SCARCE' | 'NORMAL' | 'ABUNDANT';
export type TradeAccess = 'LOW' | 'NORMAL' | 'HIGH';
export type DisasterRate = 'LOW' | 'NORMAL' | 'HIGH';

export interface MapSeedData {
  id: string;
  name: string;
  seed: number;
  resourceRichness: ResourceRichness;
  oilBias: number;       // 0-1
  mineralBias: number;   // 0-1
  tradeAccess: TradeAccess;
  disasterRate: DisasterRate;
}

// Apply map seed modifiers to initial stats
export function applyMapSeedModifiers(stats: NationStats, mapSeed: MapSeedData): NationStats {
  const modified = { ...stats };

  // Resource richness affects initial resources
  const richnessMultiplier = {
    SCARCE: 0.7,
    NORMAL: 1.0,
    ABUNDANT: 1.3,
  }[mapSeed.resourceRichness];
  modified.resources = Math.round(modified.resources * richnessMultiplier);

  // Trade access affects GDP
  const tradeMultiplier = {
    LOW: 0.9,
    NORMAL: 1.0,
    HIGH: 1.1,
  }[mapSeed.tradeAccess];
  modified.gdp = Math.round(modified.gdp * tradeMultiplier);

  return modified;
}
