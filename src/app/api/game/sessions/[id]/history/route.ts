import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/game/sessions/[id]/history - Get turn history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify session ownership
    const gameSession = await prisma.gameSession.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Get turn snapshots with events
    const snapshots = await prisma.turnSnapshot.findMany({
      where: { sessionId: id },
      orderBy: { turnNumber: 'desc' },
      take: limit,
      skip: offset,
      include: {
        eventInstances: {
          include: {
            definition: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Get corresponding decisions
    const turnNumbers = snapshots.map((s) => s.turnNumber);
    const decisions = await prisma.turnDecision.findMany({
      where: {
        sessionId: id,
        turnNumber: { in: turnNumbers },
      },
    });

    // Map decisions to snapshots
    const decisionMap = new Map(decisions.map((d) => [d.turnNumber, d]));

    const history = snapshots.map((snapshot) => ({
      turnNumber: snapshot.turnNumber,
      statsSnapshot: snapshot.statsSnapshot,
      scoreChange: snapshot.scoreChange,
      totalScore: snapshot.totalScore,
      processedAt: snapshot.processedAt,
      decision: decisionMap.get(snapshot.turnNumber) || null,
      events: snapshot.eventInstances.map((e) => ({
        id: e.id,
        name: e.definition.name,
        category: e.definition.category,
        appliedEffects: e.appliedEffects,
      })),
    }));

    // Get total count for pagination
    const totalCount = await prisma.turnSnapshot.count({
      where: { sessionId: id },
    });

    return NextResponse.json({
      history,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Failed to fetch turn history:', error);
    return NextResponse.json({ error: '턴 기록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
