import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { acquireLock, releaseLock } from '@/lib/cache/redis';
import { NationStats, Budget, ScoreWeights, DEFAULT_SCORE_WEIGHTS, PolicyEffect, PolicyCondition } from '@/types/game';
import { calculateNewStats } from './statsCalculator';
import { calculateFinalScore, checkGameOverConditions } from './scoreCalculator';
import { processSessionEvents } from './eventProcessor';

const SETTLEMENT_LOCK_PREFIX = 'settlement:session:';

const DEFAULT_BUDGET: Budget = {
  economy: 20,
  welfare: 20,
  research: 20,
  military: 20,
  diplomacy: 20,
};

interface SettlementResult {
  success: boolean;
  sessionId: string;
  turnNumber: number;
  previousStats?: NationStats;
  newStats?: NationStats;
  scoreChange?: number;
  totalScore?: number;
  isGameOver?: boolean;
  gameOverReason?: string;
  error?: string;
}

/**
 * Process settlement for a single game session
 */
export async function processSessionSettlement(
  sessionId: string,
  scoreWeights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): Promise<SettlementResult> {
  const lockKey = `${SETTLEMENT_LOCK_PREFIX}${sessionId}`;

  // Acquire distributed lock for idempotency
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return {
      success: false,
      sessionId,
      turnNumber: 0,
      error: '다른 정산 프로세스가 진행 중입니다.',
    };
  }

  try {
    // Get session first
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        season: true,
      },
    });

    if (!session) {
      return {
        success: false,
        sessionId,
        turnNumber: 0,
        error: '게임 세션을 찾을 수 없습니다.',
      };
    }

    // Get turn decision for current turn
    const turnDecisions = await prisma.turnDecision.findMany({
      where: {
        sessionId,
        turnNumber: session.currentTurn,
      },
      take: 1,
    });

    if (session.status !== 'ACTIVE') {
      return {
        success: false,
        sessionId,
        turnNumber: session.currentTurn,
        error: '진행 중인 게임이 아닙니다.',
      };
    }

    // Check if already processed (idempotency)
    const existingSnapshot = await prisma.turnSnapshot.findUnique({
      where: {
        sessionId_turnNumber: {
          sessionId,
          turnNumber: session.currentTurn,
        },
      },
    });

    if (existingSnapshot) {
      return {
        success: true,
        sessionId,
        turnNumber: session.currentTurn,
        newStats: existingSnapshot.statsSnapshot as unknown as NationStats,
        scoreChange: existingSnapshot.scoreChange,
        totalScore: existingSnapshot.totalScore,
        error: '이미 정산이 완료되었습니다.',
      };
    }

    // Get turn decision (use default if not submitted)
    const turnDecision = turnDecisions[0];
    const budget: Budget = (turnDecision?.budget as unknown as Budget) || { ...DEFAULT_BUDGET };
    const activePolicyIds = (turnDecision?.activePolicies as unknown as string[]) || [];

    // Get policy cards
    const policyCards = await prisma.policyCard.findMany({
      where: {
        id: { in: activePolicyIds },
        isActive: true,
      },
    });

    const policyCardData = policyCards.map((card) => ({
      id: card.id,
      effects: card.effects as unknown as PolicyEffect[],
      conditions: card.conditions as unknown as PolicyCondition[] | undefined,
    }));

    // Calculate new stats (budget + policy + natural)
    const currentStats = session.currentStats as unknown as NationStats;
    const { newStats: baseStats } = calculateNewStats(currentStats, budget, policyCardData);

    let finalStats: NationStats = baseStats;
    let scoreChange = 0;
    let newScore = session.totalScore;
    let gameOverCheck: { isGameOver: boolean; reason?: string } = { isGameOver: false };

    // Create snapshot and update session in transaction
    await prisma.$transaction(async (tx) => {
      // Create turn snapshot first (to get snapshotId for event instances)
      const snapshot = await tx.turnSnapshot.create({
        data: {
          sessionId,
          turnNumber: session.currentTurn,
          statsSnapshot: baseStats as unknown as Prisma.InputJsonValue,
          scoreChange: 0,
          totalScore: session.totalScore,
        },
      });

      // Process events (trigger new events, apply effects, update durations)
      const eventResult = await processSessionEvents(
        sessionId,
        snapshot.id,
        baseStats,
        session.currentTurn,
        tx as unknown as Parameters<typeof processSessionEvents>[4]
      );
      finalStats = eventResult.newStats;

      // Check game over conditions after event effects
      gameOverCheck = checkGameOverConditions(finalStats);

      // Calculate score with final stats
      const scoreResult = calculateFinalScore(
        finalStats,
        currentStats,
        session.totalScore,
        session.currentTurn,
        scoreWeights
      );
      newScore = scoreResult.newScore;
      scoreChange = scoreResult.scoreChange;

      // Update snapshot with final values
      await tx.turnSnapshot.update({
        where: { id: snapshot.id },
        data: {
          statsSnapshot: finalStats as unknown as Prisma.InputJsonValue,
          scoreChange,
          totalScore: newScore,
        },
      });

      // Update session
      await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          currentStats: finalStats as unknown as Prisma.InputJsonValue,
          currentTurn: session.currentTurn + 1,
          totalScore: newScore,
          status: gameOverCheck.isGameOver ? 'COMPLETED' : 'ACTIVE',
        },
      });
    });

    return {
      success: true,
      sessionId,
      turnNumber: session.currentTurn,
      previousStats: currentStats,
      newStats: finalStats,
      scoreChange,
      totalScore: newScore,
      isGameOver: gameOverCheck.isGameOver,
      gameOverReason: gameOverCheck.reason,
    };
  } catch (error) {
    console.error(`Settlement failed for session ${sessionId}:`, error);
    return {
      success: false,
      sessionId,
      turnNumber: 0,
      error: error instanceof Error ? error.message : '정산 처리 중 오류가 발생했습니다.',
    };
  } finally {
    await releaseLock(lockKey);
  }
}

/**
 * Process settlement for all active sessions in a season
 */
export async function processSeasonSettlement(seasonId: string): Promise<{
  processed: number;
  failed: number;
  results: SettlementResult[];
}> {
  // Get score weights from season
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  const scoreWeights = (season?.scoreWeights as unknown as ScoreWeights) || DEFAULT_SCORE_WEIGHTS;

  // Get all active sessions for the season
  const activeSessions = await prisma.gameSession.findMany({
    where: {
      seasonId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  const results: SettlementResult[] = [];
  let processed = 0;
  let failed = 0;

  // Process each session
  for (const session of activeSessions) {
    const result = await processSessionSettlement(session.id, scoreWeights);
    results.push(result);

    if (result.success) {
      processed++;
    } else {
      failed++;
    }
  }

  return { processed, failed, results };
}

/**
 * Daily settlement job - process all active seasons
 */
export async function runDailySettlement(): Promise<{
  seasonsProcessed: number;
  totalProcessed: number;
  totalFailed: number;
}> {
  // Get all active seasons
  const activeSeasons = await prisma.season.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  let totalProcessed = 0;
  let totalFailed = 0;

  for (const season of activeSeasons) {
    const { processed, failed } = await processSeasonSettlement(season.id);
    totalProcessed += processed;
    totalFailed += failed;
  }

  console.log(`Daily settlement complete: ${totalProcessed} processed, ${totalFailed} failed`);

  return {
    seasonsProcessed: activeSeasons.length,
    totalProcessed,
    totalFailed,
  };
}
