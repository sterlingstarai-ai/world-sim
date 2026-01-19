import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';

const LEADERBOARD_CACHE_KEY = 'leaderboard:season:';
const CACHE_TTL = 300; // 5 minutes

function parseIntSafe(value: string | null, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  sessionId: string;
  nationTemplate: string;
  direction: string;
  score: number;
  currentTurn: number;
  status: string;
}

// GET /api/leaderboard - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const type = searchParams.get('type') || 'SEASON'; // DAILY, WEEKLY, SEASON
    const limit = clampInt(parseIntSafe(searchParams.get('limit'), 100), 1, 100);
    const page = clampInt(parseIntSafe(searchParams.get('page'), 1), 1, 10000);

    // Get active season if not specified
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.season.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { number: 'desc' },
      });
      if (!activeSeason) {
        return NextResponse.json({ error: '활성 시즌이 없습니다.' }, { status: 400 });
      }
      targetSeasonId = activeSeason.id;
    }

    // Include limit in cache key to prevent cache pollution
    const cacheKey = `${LEADERBOARD_CACHE_KEY}${targetSeasonId}:${type}:${page}:${limit}`;

    // Try to get from cache (only if Redis is available)
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached));
        }
      } catch {
        // Cache miss or error, continue to fetch from DB
      }
    }

    // Build date filter for type
    const now = new Date();
    let dateFilter: Date | undefined;

    if (type === 'DAILY') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (type === 'WEEKLY') {
      const dayOfWeek = now.getDay();
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    }

    // Query leaderboard
    const sessions = await prisma.gameSession.findMany({
      where: {
        seasonId: targetSeasonId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        ...(dateFilter && { updatedAt: { gte: dateFilter } }),
      },
      select: {
        id: true,
        userId: true,
        totalScore: true,
        currentTurn: true,
        status: true,
        direction: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        nationTemplate: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { totalScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.gameSession.count({
      where: {
        seasonId: targetSeasonId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        ...(dateFilter && { updatedAt: { gte: dateFilter } }),
      },
    });

    // Transform to leaderboard entries
    const entries: LeaderboardEntry[] = sessions.map((session, index) => ({
      rank: (page - 1) * limit + index + 1,
      userId: session.userId,
      userName: session.user.nickname,
      userImage: session.user.avatarUrl,
      sessionId: session.id,
      nationTemplate: session.nationTemplate.displayName,
      direction: session.direction,
      score: session.totalScore,
      currentTurn: session.currentTurn,
      status: session.status,
    }));

    const response = {
      entries,
      seasonId: targetSeasonId,
      type,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache the result (only if Redis is available)
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
      } catch {
        // Cache error, continue without caching
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json({ error: '리더보드를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
