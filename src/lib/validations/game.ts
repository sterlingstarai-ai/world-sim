import { z } from 'zod';

// Direction enum
export const directionSchema = z.enum(['INDUSTRY', 'FINANCE', 'MILITARY', 'TECH']);

// Budget schema (must sum to 100)
export const budgetSchema = z.object({
  economy: z.number().min(0).max(100),
  welfare: z.number().min(0).max(100),
  research: z.number().min(0).max(100),
  military: z.number().min(0).max(100),
  diplomacy: z.number().min(0).max(100),
}).refine(
  (data) => {
    const total = data.economy + data.welfare + data.research + data.military + data.diplomacy;
    return Math.abs(total - 100) < 0.01;
  },
  { message: '예산 합계는 100이어야 합니다.' }
);

// Create GameSession input
export const createGameSessionSchema = z.object({
  nationTemplateId: z.string().min(1, '국가 템플릿을 선택해주세요.'),
  direction: directionSchema,
  challengeId: z.string().optional(),
  mapSeedId: z.string().optional(),
});

// TurnDecision input
export const turnDecisionSchema = z.object({
  sessionId: z.string().min(1),
  budget: budgetSchema,
  activePolicies: z.array(z.string()).max(8, '최대 8개의 정책만 선택할 수 있습니다.'),
  diplomacyActions: z.array(z.object({
    type: z.enum(['TRADE_AGREEMENT', 'ALLIANCE', 'SANCTION', 'AID']),
    targetNation: z.string().optional(),
    amount: z.number().optional(),
  })).optional(),
});

// API Response types
export type CreateGameSessionInput = z.infer<typeof createGameSessionSchema>;
export type TurnDecisionInput = z.infer<typeof turnDecisionSchema>;
export type Budget = z.infer<typeof budgetSchema>;
