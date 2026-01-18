import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { createPolicyDeckSchema } from '@/lib/validations/ugc';

// GET /api/ugc/policy-decks - List policy decks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PUBLISHED';
    const creatorId = searchParams.get('creatorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.PolicyDeckWhereInput = {
      ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'HIDDEN' | 'BANNED' }),
      ...(creatorId && { creatorId }),
    };

    const [policyDecks, total] = await Promise.all([
      prisma.policyDeck.findMany({
        where,
        include: {
          creator: {
            select: { id: true, nickname: true, avatarUrl: true },
          },
          deckCards: {
            include: {
              card: {
                select: { id: true, name: true, category: true, description: true },
              },
            },
            orderBy: { priority: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.policyDeck.count({ where }),
    ]);

    return NextResponse.json({
      policyDecks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch policy decks:', error);
    return NextResponse.json({ error: '정책 덱 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// POST /api/ugc/policy-decks - Create policy deck
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createPolicyDeckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, policyCardIds, priorities } = validationResult.data;

    // Verify all policy cards exist
    const policyCards = await prisma.policyCard.findMany({
      where: { id: { in: policyCardIds }, isActive: true },
    });

    if (policyCards.length !== policyCardIds.length) {
      return NextResponse.json({ error: '유효하지 않은 정책 카드가 포함되어 있습니다.' }, { status: 400 });
    }

    // Create deck with cards
    const policyDeck = await prisma.policyDeck.create({
      data: {
        creatorId: session.user.id,
        name,
        description: description || null,
        status: 'DRAFT',
        deckCards: {
          create: policyCardIds.map((cardId, index) => ({
            cardId: cardId,
            priority: priorities?.[cardId] || index + 1,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, nickname: true, avatarUrl: true },
        },
        deckCards: {
          include: {
            card: true,
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    return NextResponse.json({ policyDeck }, { status: 201 });
  } catch (error) {
    console.error('Failed to create policy deck:', error);
    return NextResponse.json({ error: '정책 덱 생성에 실패했습니다.' }, { status: 500 });
  }
}
