import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { createChallengeSchema } from '@/lib/validations/ugc';

// GET /api/ugc/challenges - List challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PUBLISHED';
    const difficulty = searchParams.get('difficulty');
    const creatorId = searchParams.get('creatorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.ChallengeWhereInput = {
      ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'HIDDEN' | 'BANNED' }),
      ...(difficulty && { difficulty: difficulty as 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME' }),
      ...(creatorId && { creatorId }),
    };

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          creator: {
            select: { id: true, nickname: true, avatarUrl: true },
          },
          _count: {
            select: { gameSessions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.challenge.count({ where }),
    ]);

    return NextResponse.json({
      challenges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch challenges:', error);
    return NextResponse.json({ error: '챌린지 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// POST /api/ugc/challenges - Create challenge
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createChallengeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, startNationTemplateId, constraints, winConditions, turnLimit, difficulty } =
      validationResult.data;

    // Verify nation template exists
    const nationTemplate = await prisma.nationTemplate.findUnique({
      where: { id: startNationTemplateId },
    });

    if (!nationTemplate) {
      return NextResponse.json({ error: '국가 템플릿을 찾을 수 없습니다.' }, { status: 400 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        creatorId: session.user.id,
        title,
        description: description || null,
        startNationTemplate: startNationTemplateId,
        constraints: constraints as unknown as Prisma.InputJsonValue,
        winConditions: winConditions as unknown as Prisma.InputJsonValue,
        turnLimit,
        difficulty,
        status: 'DRAFT',
      },
      include: {
        creator: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Failed to create challenge:', error);
    return NextResponse.json({ error: '챌린지 생성에 실패했습니다.' }, { status: 500 });
  }
}
