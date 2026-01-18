import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { updatePolicyDeckSchema } from '@/lib/validations/ugc';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ugc/policy-decks/[id] - Get single policy deck
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const policyDeck = await prisma.policyDeck.findUnique({
      where: { id },
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

    if (!policyDeck) {
      return NextResponse.json({ error: '정책 덱을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ policyDeck });
  } catch (error) {
    console.error('Failed to fetch policy deck:', error);
    return NextResponse.json({ error: '정책 덱을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// PATCH /api/ugc/policy-decks/[id] - Update policy deck
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updatePolicyDeckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const existingDeck = await prisma.policyDeck.findUnique({
      where: { id },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: '정책 덱을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existingDeck.creatorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const { policyCardIds, priorities, ...rest } = validationResult.data;

    // If updating cards, delete existing and recreate
    if (policyCardIds) {
      await prisma.policyDeckCard.deleteMany({
        where: { deckId: id },
      });

      await prisma.policyDeckCard.createMany({
        data: policyCardIds.map((cardId, index) => ({
          deckId: id,
          cardId: cardId,
          priority: priorities?.[cardId] || index + 1,
        })),
      });
    }

    const policyDeck = await prisma.policyDeck.update({
      where: { id },
      data: rest,
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

    return NextResponse.json({ policyDeck });
  } catch (error) {
    console.error('Failed to update policy deck:', error);
    return NextResponse.json({ error: '정책 덱 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE /api/ugc/policy-decks/[id] - Delete policy deck
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const policyDeck = await prisma.policyDeck.findUnique({
      where: { id },
    });

    if (!policyDeck) {
      return NextResponse.json({ error: '정책 덱을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (policyDeck.creatorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await prisma.policyDeck.delete({ where: { id } });

    return NextResponse.json({ message: '정책 덱이 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete policy deck:', error);
    return NextResponse.json({ error: '정책 덱 삭제에 실패했습니다.' }, { status: 500 });
  }
}

// POST /api/ugc/policy-decks/[id]?action=like|copy - Like or copy a policy deck
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'like') {
      // Simple like count increment (no separate Like model)
      await prisma.policyDeck.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });
      return NextResponse.json({ liked: true, message: '좋아요를 눌렀습니다.' });
    }

    if (action === 'copy') {
      // Copy deck
      const originalDeck = await prisma.policyDeck.findUnique({
        where: { id },
        include: {
          deckCards: true,
        },
      });

      if (!originalDeck) {
        return NextResponse.json({ error: '정책 덱을 찾을 수 없습니다.' }, { status: 404 });
      }

      const newDeck = await prisma.policyDeck.create({
        data: {
          creatorId: session.user.id,
          name: `${originalDeck.name} (복사본)`,
          description: originalDeck.description,
          status: 'DRAFT',
          deckCards: {
            create: originalDeck.deckCards.map((dc) => ({
              cardId: dc.cardId,
              priority: dc.priority,
            })),
          },
        },
        include: {
          deckCards: {
            include: {
              card: true,
            },
          },
        },
      });

      // Increment copy count on original
      await prisma.policyDeck.update({
        where: { id },
        data: { copyCount: { increment: 1 } },
      });

      return NextResponse.json({ policyDeck: newDeck, message: '덱이 복사되었습니다.' }, { status: 201 });
    }

    return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process action:', error);
    return NextResponse.json({ error: '처리에 실패했습니다.' }, { status: 500 });
  }
}
