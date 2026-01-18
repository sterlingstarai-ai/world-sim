import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { createGameSessionSchema } from '@/lib/validations/game';
import { DIRECTION_BONUSES, DEFAULT_STATS, NationStats } from '@/types/game';

// GET /api/game/sessions - Get user's game sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const seasonId = searchParams.get('seasonId');

    const gameSessions = await prisma.gameSession.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status as 'ACTIVE' | 'COMPLETED' | 'ABANDONED' }),
        ...(seasonId && { seasonId }),
      },
      include: {
        nationTemplate: true,
        season: true,
        challenge: true,
        _count: {
          select: { turnDecisions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ sessions: gameSessions });
  } catch (error) {
    console.error('Failed to fetch game sessions:', error);
    return NextResponse.json({ error: '게임 세션을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// POST /api/game/sessions - Create new game session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createGameSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { nationTemplateId, direction, challengeId, mapSeedId } = validationResult.data;

    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { number: 'desc' },
    });

    if (!activeSeason) {
      return NextResponse.json({ error: '활성화된 시즌이 없습니다.' }, { status: 400 });
    }

    // Get nation template
    const nationTemplate = await prisma.nationTemplate.findUnique({
      where: { id: nationTemplateId },
    });

    if (!nationTemplate) {
      return NextResponse.json({ error: '국가 템플릿을 찾을 수 없습니다.' }, { status: 400 });
    }

    // Calculate initial stats with direction bonus
    const baseStats = nationTemplate.initialStats as unknown as NationStats;
    const directionBonus = DIRECTION_BONUSES[direction] || {};
    const initialStats: NationStats = {
      gdp: baseStats.gdp + (directionBonus.gdp || 0),
      industry: baseStats.industry + (directionBonus.industry || 0),
      resources: baseStats.resources + (directionBonus.resources || 0),
      techLevel: baseStats.techLevel + (directionBonus.techLevel || 0),
      research: baseStats.research + (directionBonus.research || 0),
      military: baseStats.military + (directionBonus.military || 0),
      population: baseStats.population + (directionBonus.population || 0),
      happiness: baseStats.happiness + (directionBonus.happiness || 0),
      diplomacy: baseStats.diplomacy + (directionBonus.diplomacy || 0),
    };

    // Check for existing active session
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        userId: session.user.id,
        seasonId: activeSeason.id,
        status: 'ACTIVE',
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: '이미 진행 중인 게임 세션이 있습니다.', existingSessionId: existingSession.id },
        { status: 400 }
      );
    }

    // Create game session
    const gameSession = await prisma.gameSession.create({
      data: {
        userId: session.user.id,
        seasonId: activeSeason.id,
        nationTemplateId,
        direction,
        challengeId: challengeId || null,
        mapSeedId: mapSeedId || null,
        currentStats: initialStats as unknown as Prisma.InputJsonValue,
        currentTurn: 1,
        totalScore: 0,
        status: 'ACTIVE',
      },
      include: {
        nationTemplate: true,
        season: true,
      },
    });

    return NextResponse.json({ session: gameSession }, { status: 201 });
  } catch (error) {
    console.error('Failed to create game session:', error);
    return NextResponse.json({ error: '게임 세션 생성에 실패했습니다.' }, { status: 500 });
  }
}
