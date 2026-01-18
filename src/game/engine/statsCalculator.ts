import { NationStats, Budget, PolicyEffect, PolicyCondition } from '@/types/game';

interface PolicyCardData {
  id: string;
  effects: PolicyEffect[];
  conditions?: PolicyCondition[];
}

/**
 * Calculate stat changes from budget allocation
 * Budget affects stats proportionally
 */
export function calculateBudgetEffects(
  stats: NationStats,
  budget: Budget
): Partial<NationStats> {
  const effects: Partial<NationStats> = {};

  // Economy budget affects GDP and industry
  if (budget.economy > 0) {
    const economyFactor = (budget.economy - 20) / 100; // -0.2 to 0.8
    effects.gdp = Math.round(stats.gdp * 0.05 * economyFactor);
    effects.industry = Math.round(3 * economyFactor);
  }

  // Welfare budget affects happiness and population
  if (budget.welfare > 0) {
    const welfareFactor = (budget.welfare - 20) / 100;
    effects.happiness = Math.round(5 * welfareFactor);
    effects.population = Math.round(2 * welfareFactor);
  }

  // Research budget affects tech and research
  if (budget.research > 0) {
    const researchFactor = (budget.research - 20) / 100;
    effects.techLevel = Math.round(3 * welfareFactor(researchFactor));
    effects.research = Math.round(5 * researchFactor);
  }

  // Military budget affects military power
  if (budget.military > 0) {
    const militaryFactor = (budget.military - 20) / 100;
    effects.military = Math.round(5 * militaryFactor);
  }

  // Diplomacy budget affects diplomacy
  if (budget.diplomacy > 0) {
    const diplomacyFactor = (budget.diplomacy - 20) / 100;
    effects.diplomacy = Math.round(5 * diplomacyFactor);
  }

  return effects;
}

// Helper function for research factor calculation
function welfareFactor(factor: number): number {
  return factor;
}

/**
 * Check if policy conditions are met
 */
export function checkPolicyConditions(
  stats: NationStats,
  conditions?: PolicyCondition[]
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const statValue = stats[condition.stat];
    switch (condition.operator) {
      case 'GT':
        return statValue > condition.value;
      case 'GTE':
        return statValue >= condition.value;
      case 'LT':
        return statValue < condition.value;
      case 'LTE':
        return statValue <= condition.value;
      case 'EQ':
        return statValue === condition.value;
      default:
        return true;
    }
  });
}

/**
 * Calculate stat changes from active policies
 */
export function calculatePolicyEffects(
  stats: NationStats,
  policyCards: PolicyCardData[]
): Partial<NationStats> {
  const effects: Partial<NationStats> = {};

  for (const card of policyCards) {
    // Check conditions
    if (!checkPolicyConditions(stats, card.conditions as PolicyCondition[])) {
      continue;
    }

    // Apply effects
    for (const effect of card.effects) {
      const stat = effect.stat as keyof NationStats;
      const currentEffect = effects[stat] || 0;

      if (effect.type === 'ADD') {
        effects[stat] = currentEffect + effect.value;
      } else if (effect.type === 'MULTIPLY') {
        // For multiply, we accumulate the multiplier effect
        effects[stat] = currentEffect + Math.round(stats[stat] * (effect.value - 1));
      }
    }
  }

  return effects;
}

/**
 * Apply natural decay/growth to stats
 * Some stats naturally change over time
 */
export function calculateNaturalChanges(stats: NationStats): Partial<NationStats> {
  const effects: Partial<NationStats> = {};

  // GDP has natural growth based on industry and tech
  const gdpGrowthRate = 0.01 + (stats.industry / 1000) + (stats.techLevel / 2000);
  effects.gdp = Math.round(stats.gdp * gdpGrowthRate);

  // Happiness naturally decays slightly (needs active management)
  if (stats.happiness > 50) {
    effects.happiness = -1;
  }

  // Research produces tech over time
  if (stats.research > 30) {
    effects.techLevel = Math.round((stats.research - 30) / 20);
  }

  // Population grows with happiness
  if (stats.happiness > 60 && stats.population < 100) {
    effects.population = 1;
  } else if (stats.happiness < 30 && stats.population > 20) {
    effects.population = -1;
  }

  return effects;
}

/**
 * Apply stat bounds (min/max values)
 */
export function applyStatBounds(stats: NationStats): NationStats {
  return {
    gdp: Math.max(0, stats.gdp), // No upper bound for GDP
    industry: Math.max(0, Math.min(100, stats.industry)),
    resources: Math.max(0, Math.min(100, stats.resources)),
    techLevel: Math.max(0, Math.min(100, stats.techLevel)),
    research: Math.max(0, Math.min(100, stats.research)),
    military: Math.max(0, Math.min(100, stats.military)),
    population: Math.max(1, Math.min(100, stats.population)), // Min 1 population
    happiness: Math.max(0, Math.min(100, stats.happiness)),
    diplomacy: Math.max(0, Math.min(100, stats.diplomacy)),
  };
}

/**
 * Merge partial stat effects into cumulative changes
 */
export function mergeEffects(...effectsList: Partial<NationStats>[]): Partial<NationStats> {
  const merged: Partial<NationStats> = {};

  for (const effects of effectsList) {
    for (const [key, value] of Object.entries(effects)) {
      const stat = key as keyof NationStats;
      merged[stat] = (merged[stat] || 0) + (value || 0);
    }
  }

  return merged;
}

/**
 * Apply effects to stats
 */
export function applyEffects(
  stats: NationStats,
  effects: Partial<NationStats>
): NationStats {
  const newStats: NationStats = { ...stats };

  for (const [key, value] of Object.entries(effects)) {
    const stat = key as keyof NationStats;
    newStats[stat] = (newStats[stat] || 0) + (value || 0);
  }

  return applyStatBounds(newStats);
}

/**
 * Main calculation function: process all stat changes for a turn
 */
export function calculateNewStats(
  currentStats: NationStats,
  budget: Budget,
  policyCards: PolicyCardData[]
): { newStats: NationStats; changes: Partial<NationStats> } {
  // Calculate all effects
  const budgetEffects = calculateBudgetEffects(currentStats, budget);
  const policyEffects = calculatePolicyEffects(currentStats, policyCards);
  const naturalChanges = calculateNaturalChanges(currentStats);

  // Merge all effects
  const totalChanges = mergeEffects(budgetEffects, policyEffects, naturalChanges);

  // Apply to stats
  const newStats = applyEffects(currentStats, totalChanges);

  return { newStats, changes: totalChanges };
}
