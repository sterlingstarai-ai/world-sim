import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/game/nation-templates - Get all nation templates
export async function GET() {
  try {
    const templates = await prisma.nationTemplate.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch nation templates:', error);
    return NextResponse.json(
      { error: '국가 템플릿을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
