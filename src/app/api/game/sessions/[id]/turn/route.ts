import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { turnDecisionSchema } from '@/lib/validations/game';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/game/sessions/[id]/turn - Submit turn decision
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = turnDecisionSchema.safeParse({ ...body, sessionId: id });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { budget, activePolicies, diplomacyActions } = validationResult.data;

    // Get game session
    const gameSession = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        turnDecisions: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    if (gameSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: '진행 중인 게임이 아닙니다.' }, { status: 400 });
    }

    // Check if turn already submitted
    const lastDecision = gameSession.turnDecisions[0];
    if (lastDecision && lastDecision.turnNumber >= gameSession.currentTurn) {
      return NextResponse.json(
        { error: '이미 이번 턴의 결정을 제출했습니다.', decision: lastDecision },
        { status: 400 }
      );
    }

    // Validate policy cards exist
    if (activePolicies.length > 0) {
      const policyCount = await prisma.policyCard.count({
        where: {
          id: { in: activePolicies },
          isActive: true,
        },
      });

      if (policyCount !== activePolicies.length) {
        return NextResponse.json(
          { error: '유효하지 않은 정책 카드가 포함되어 있습니다.' },
          { status: 400 }
        );
      }
    }

    // Create turn decision
    const turnDecision = await prisma.turnDecision.create({
      data: {
        sessionId: id,
        turnNumber: gameSession.currentTurn,
        budget,
        activePolicies,
        diplomacyActions: diplomacyActions || Prisma.DbNull,
      },
    });

    return NextResponse.json({
      decision: turnDecision,
      message: '턴 결정이 제출되었습니다. 정산은 매일 자정에 진행됩니다.',
    });
  } catch (error) {
    console.error('Failed to submit turn decision:', error);
    return NextResponse.json({ error: '턴 결정 제출에 실패했습니다.' }, { status: 500 });
  }
}

// GET /api/game/sessions/[id]/turn - Get current turn info
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const gameSession = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        turnDecisions: {
          where: { turnNumber: { gte: 0 } },
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
        turnSnapshots: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const lastDecision = gameSession.turnDecisions[0];
    const lastSnapshot = gameSession.turnSnapshots[0];

    const hasSubmittedCurrentTurn = lastDecision && lastDecision.turnNumber >= gameSession.currentTurn;

    return NextResponse.json({
      currentTurn: gameSession.currentTurn,
      hasSubmittedCurrentTurn,
      lastDecision: lastDecision || null,
      lastSnapshot: lastSnapshot || null,
    });
  } catch (error) {
    console.error('Failed to get turn info:', error);
    return NextResponse.json({ error: '턴 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
