import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { updateChallengeSchema } from '@/lib/validations/ugc';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ugc/challenges/[id] - Get single challenge
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
        _count: {
          select: { gameSessions: true },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Failed to fetch challenge:', error);
    return NextResponse.json({ error: '챌린지를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// PATCH /api/ugc/challenges/[id] - Update challenge
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateChallengeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check ownership
    const existingChallenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existingChallenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // Cannot modify published challenges (except status)
    if (existingChallenge.status === 'PUBLISHED' && Object.keys(body).some((k) => k !== 'status')) {
      return NextResponse.json({ error: '이미 공개된 챌린지는 수정할 수 없습니다.' }, { status: 400 });
    }

    const { constraints, winConditions, ...rest } = validationResult.data;

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...rest,
        ...(constraints && { constraints: constraints as unknown as Prisma.InputJsonValue }),
        ...(winConditions && { winConditions: winConditions as unknown as Prisma.InputJsonValue }),
      },
      include: {
        creator: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Failed to update challenge:', error);
    return NextResponse.json({ error: '챌린지 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/ugc/challenges/[id] - Delete challenge
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // Cannot delete published challenges
    if (challenge.status === 'PUBLISHED') {
      return NextResponse.json({ error: '공개된 챌린지는 삭제할 수 없습니다.' }, { status: 400 });
    }

    await prisma.challenge.delete({ where: { id } });

    return NextResponse.json({ message: '챌린지가 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete challenge:', error);
    return NextResponse.json({ error: '챌린지 삭제에 실패했습니다.' }, { status: 500 });
  }
}
