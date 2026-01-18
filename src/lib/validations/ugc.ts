import { z } from 'zod';

// ==================== CHALLENGE VALIDATION ====================

const constraintSchema = z.object({
  type: z.enum(['STAT_LIMIT', 'BUDGET_LOCK', 'POLICY_REQUIRED', 'POLICY_BANNED']),
  stat: z.string().optional(),
  budgetCategory: z.string().optional(),
  operator: z.enum(['GT', 'LT', 'EQ', 'GTE', 'LTE']).optional(),
  value: z.number().optional(),
  policyId: z.string().optional(),
});

const winConditionSchema = z.object({
  type: z.enum(['STAT_TARGET', 'SURVIVE_TURNS', 'SCORE_TARGET']),
  stat: z.string().optional(),
  operator: z.enum(['GT', 'LT', 'EQ', 'GTE', 'LTE']).optional(),
  value: z.number(),
});

export const createChallengeSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  startNationTemplateId: z.string(),
  constraints: z.array(constraintSchema).default([]),
  winConditions: z.array(winConditionSchema).min(1),
  turnLimit: z.number().int().min(5).max(100).default(30),
  difficulty: z.enum(['EASY', 'NORMAL', 'HARD', 'EXTREME']).default('NORMAL'),
});

export const updateChallengeSchema = createChallengeSchema.partial().extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'HIDDEN', 'BANNED']).optional(),
});

// ==================== POLICY DECK VALIDATION ====================

export const createPolicyDeckSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  policyCardIds: z.array(z.string()).min(1).max(8),
  priorities: z.record(z.string(), z.number().int().min(1).max(8)).optional(),
});

export const updatePolicyDeckSchema = createPolicyDeckSchema.partial().extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'HIDDEN', 'BANNED']).optional(),
});

// ==================== TYPE EXPORTS ====================

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type CreatePolicyDeckInput = z.infer<typeof createPolicyDeckSchema>;
export type UpdatePolicyDeckInput = z.infer<typeof updatePolicyDeckSchema>;
