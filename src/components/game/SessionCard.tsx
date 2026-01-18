'use client';

import Link from 'next/link';
import { NationStats, Direction } from '@/types/game';

interface SessionCardProps {
  session: {
    id: string;
    direction: Direction;
    currentStats: NationStats;
    currentTurn: number;
    totalScore: number;
    status: string;
    nationTemplate?: {
      displayName: string;
    };
    season?: {
      name: string;
    };
    _count?: {
      turnDecisions: number;
    };
    updatedAt?: string;
  };
  onAbandon?: (id: string) => void;
}

const DIRECTION_LABELS: Record<Direction, { label: string; icon: string }> = {
  INDUSTRY: { label: '산업 노선', icon: '🏭' },
  FINANCE: { label: '금융 노선', icon: '💹' },
  MILITARY: { label: '군사 노선', icon: '⚔️' },
  TECH: { label: '기술 노선', icon: '🔬' },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '진행 중', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: '완료', color: 'bg-blue-100 text-blue-800' },
  ABANDONED: { label: '포기', color: 'bg-gray-100 text-gray-800' },
};

export function SessionCard({ session, onAbandon }: SessionCardProps) {
  const directionInfo = DIRECTION_LABELS[session.direction];
  const statusInfo = STATUS_BADGES[session.status] || STATUS_BADGES.ACTIVE;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">
            {session.nationTemplate?.displayName || '국가'}
          </h3>
          <p className="text-sm text-gray-500">
            {directionInfo.icon} {directionInfo.label} · {session.season?.name || 'S1'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">턴</div>
          <div className="font-bold">{session.currentTurn}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">점수</div>
          <div className="font-bold text-blue-600">{session.totalScore.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-xs text-gray-500">GDP</div>
          <div className="font-bold text-yellow-600">
            {session.currentStats.gdp.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {session.status === 'ACTIVE' ? (
          <>
            <Link
              href={`/game/${session.id}`}
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              계속하기
            </Link>
            {onAbandon && (
              <button
                onClick={() => onAbandon(session.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                포기
              </button>
            )}
          </>
        ) : (
          <Link
            href={`/game/${session.id}`}
            className="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            기록 보기
          </Link>
        )}
      </div>
    </div>
  );
}
