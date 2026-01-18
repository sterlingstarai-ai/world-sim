import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/game/policy-cards - Get all active policy cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const policyCards = await prisma.policyCard.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as 'ECONOMY' | 'WELFARE' | 'TECH' | 'MILITARY' | 'DIPLOMACY' | 'RISK' }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ cards: policyCards });
  } catch (error) {
    console.error('Failed to fetch policy cards:', error);
    return NextResponse.json(
      { error: '정책 카드를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
