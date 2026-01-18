import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/game/sessions/[id] - Get specific game session
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
        nationTemplate: true,
        season: true,
        challenge: true,
        mapSeed: true,
        turnDecisions: {
          orderBy: { turnNumber: 'desc' },
          take: 5,
        },
        turnSnapshots: {
          orderBy: { turnNumber: 'desc' },
          take: 5,
        },
        eventInstances: {
          where: { remainingDuration: { gt: 0 } },
          include: { definition: true },
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Check ownership
    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ session: gameSession });
  } catch (error) {
    console.error('Failed to fetch game session:', error);
    return NextResponse.json({ error: '게임 세션을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// PATCH /api/game/sessions/[id] - Update game session status (abandon)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['ABANDONED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
    }

    const gameSession = await prisma.gameSession.findUnique({
      where: { id },
    });

    if (!gameSession) {
      return NextResponse.json({ error: '게임 세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (gameSession.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    if (gameSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: '이미 종료된 게임 세션입니다.' }, { status: 400 });
    }

    const updatedSession = await prisma.gameSession.update({
      where: { id },
      data: { status },
      include: {
        nationTemplate: true,
        season: true,
      },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Failed to update game session:', error);
    return NextResponse.json({ error: '게임 세션 업데이트에 실패했습니다.' }, { status: 500 });
  }
}
