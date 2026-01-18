import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { processSessionSettlement, runDailySettlement } from '@/game/engine';

// POST /api/settlement - Trigger settlement (admin or cron)
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret or admin session
    const cronSecret = request.headers.get('x-cron-secret');
    const session = await getServerSession(authOptions);

    const isValidCron = cronSecret === process.env.CRON_SECRET;
    const isAdmin = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isAdmin: true },
        }).then((u) => u?.isAdmin)
      : false;

    if (!isValidCron && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId, seasonId, runAll } = body;

    // Single session settlement
    if (sessionId) {
      const result = await processSessionSettlement(sessionId);
      return NextResponse.json({ result });
    }

    // Season settlement
    if (seasonId) {
      const activeSessions = await prisma.gameSession.findMany({
        where: { seasonId, status: 'ACTIVE' },
        select: { id: true },
      });

      const results = [];
      for (const s of activeSessions) {
        const result = await processSessionSettlement(s.id);
        results.push(result);
      }

      return NextResponse.json({
        processed: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      });
    }

    // Run all (daily job)
    if (runAll) {
      const result = await runDailySettlement();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'sessionId, seasonId, or runAll required' }, { status: 400 });
  } catch (error) {
    console.error('Settlement API error:', error);
    return NextResponse.json({ error: '정산 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET /api/settlement - Check settlement status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Verify ownership
    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, currentTurn: true },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // Check latest snapshot
    const latestSnapshot = await prisma.turnSnapshot.findFirst({
      where: { sessionId },
      orderBy: { turnNumber: 'desc' },
      select: { turnNumber: true, processedAt: true },
    });

    const isSettled = latestSnapshot?.turnNumber === gameSession.currentTurn - 1;

    return NextResponse.json({
      currentTurn: gameSession.currentTurn,
      lastSettledTurn: latestSnapshot?.turnNumber || 0,
      lastSettledAt: latestSnapshot?.processedAt || null,
      isSettled,
    });
  } catch (error) {
    console.error('Settlement status check error:', error);
    return NextResponse.json({ error: '정산 상태 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
