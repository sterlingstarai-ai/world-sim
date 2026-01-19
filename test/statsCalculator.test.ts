import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateBudgetEffects } from '../src/game/engine/statsCalculator';
import { DEFAULT_STATS, Budget } from '../src/types/game';

test('calculateBudgetEffects: budget factor is applied consistently and research budget only affects research stats', () => {
  const stats = { ...DEFAULT_STATS, gdp: 1000 };

  const budget: Budget = {
    economy: 30,   // factor: (30-20)/100 = 0.10
    welfare: 20,   // factor: (20-20)/100 = 0.00
    research: 40,  // factor: (40-20)/100 = 0.20
    military: 20,
    diplomacy: 20,
  };

  const effects = calculateBudgetEffects(stats, budget);

  // economy: gdp = 1000 * 0.05 * 0.10 = 5, industry = 3 * 0.10 = 0.3 -> round 0
  assert.equal(effects.gdp, 5);
  assert.equal(effects.industry, 0);

  // research: techLevel = 3 * 0.20 = 0.6 -> round 1, research = 5 * 0.20 = 1
  assert.equal(effects.techLevel, 1);
  assert.equal(effects.research, 1);

  // welfare at baseline (20%) should produce 0 effect
  assert.equal(effects.happiness, 0);
  assert.equal(effects.population, 0);

  // military and diplomacy at baseline
  assert.equal(effects.military, 0);
  assert.equal(effects.diplomacy, 0);
});

test('calculateBudgetEffects: negative factor when budget is below baseline', () => {
  const stats = { ...DEFAULT_STATS, gdp: 1000 };

  const budget: Budget = {
    economy: 10,   // factor: (10-20)/100 = -0.10
    welfare: 10,   // factor: -0.10
    research: 10,  // factor: -0.10
    military: 10,
    diplomacy: 10,
  };

  const effects = calculateBudgetEffects(stats, budget);

  // economy: gdp = 1000 * 0.05 * -0.10 = -5
  assert.equal(effects.gdp, -5);

  // welfare: happiness = 5 * -0.10 = -0.5 -> Math.round(-0.5) = -0 in JavaScript
  // Use Object.is to handle -0 vs 0, or just check it rounds to a small value
  assert.ok(effects.happiness === 0 || Object.is(effects.happiness, -0), 'happiness should round to 0 or -0');

  // research: techLevel = 3 * -0.10 = -0.3 -> round 0
  assert.ok(effects.techLevel === 0 || Object.is(effects.techLevel, -0), 'techLevel should round to 0 or -0');
});

test('calculateBudgetEffects: maximum budget allocation', () => {
  const stats = { ...DEFAULT_STATS, gdp: 1000 };

  const budget: Budget = {
    economy: 100,  // factor: (100-20)/100 = 0.80
    welfare: 0,
    research: 0,
    military: 0,
    diplomacy: 0,
  };

  const effects = calculateBudgetEffects(stats, budget);

  // economy: gdp = 1000 * 0.05 * 0.80 = 40, industry = 3 * 0.80 = 2.4 -> round 2
  assert.equal(effects.gdp, 40);
  assert.equal(effects.industry, 2);
});
