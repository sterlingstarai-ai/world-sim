'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

type LeaderboardType = 'DAILY' | 'WEEKLY' | 'SEASON';

const directionLabels: Record<string, string> = {
  INDUSTRY: '산업',
  FINANCE: '금융',
  MILITARY: '군사',
  TECH: '기술',
};

const directionColors: Record<string, string> = {
  INDUSTRY: 'text-orange-600',
  FINANCE: 'text-green-600',
  MILITARY: 'text-red-600',
  TECH: 'text-purple-600',
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<LeaderboardType>('SEASON');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLeaderboard();
  }, [type, page]);

  async function loadLeaderboard() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/leaderboard?type=${type}&page=${page}&limit=50`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getRankStyle(rank: number) {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 font-bold';
    if (rank === 2) return 'bg-gray-100 text-gray-600 font-bold';
    if (rank === 3) return 'bg-orange-100 text-orange-700 font-bold';
    return '';
  }

  function getRankEmoji(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">리더보드</h1>
          <p className="text-gray-500">최고의 지도자들을 확인하세요</p>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['DAILY', 'WEEKLY', 'SEASON'] as LeaderboardType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setPage(1);
            }}
            className={`px-4 py-2 border-b-2 transition-colors ${
              type === t
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'DAILY' ? '일간' : t === 'WEEKLY' ? '주간' : '시즌'}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 기록이 없습니다.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
            게임을 시작하세요!
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.sessionId}
              className={`bg-white rounded-lg border p-4 ${getRankStyle(entry.rank)}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-10 text-center text-lg">{getRankEmoji(entry.rank)}</div>

                {/* User Info */}
                <div className="flex items-center gap-3 flex-1">
                  {entry.userImage ? (
                    <img
                      src={entry.userImage}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {(entry.userName || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{entry.userName || '익명'}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{entry.nationTemplate}</span>
                      <span className={directionColors[entry.direction]}>
                        ({directionLabels[entry.direction]})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-xl font-bold">{entry.score.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {entry.currentTurn}턴 | {entry.status === 'COMPLETED' ? '완료' : '진행중'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
