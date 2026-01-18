'use client';

import { useState, useEffect } from 'react';
import { NationStats } from '@/types/game';

interface TurnHistoryEntry {
  turnNumber: number;
  statsSnapshot: NationStats;
  scoreChange: number;
  totalScore: number;
  processedAt: string;
  decision: {
    budget: Record<string, number>;
    activePolicies: string[];
  } | null;
  events: {
    id: string;
    name: string;
    category: string;
  }[];
}

interface TurnHistoryProps {
  sessionId: string;
}

export function TurnHistory({ sessionId }: TurnHistoryProps) {
  const [history, setHistory] = useState<TurnHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [sessionId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/game/sessions/${sessionId}/history?limit=20`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : '기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 정산된 턴이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div
          key={entry.turnNumber}
          className="bg-white rounded-lg border overflow-hidden"
        >
          {/* Summary Row */}
          <button
            onClick={() =>
              setExpandedTurn(expandedTurn === entry.turnNumber ? null : entry.turnNumber)
            }
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">턴 {entry.turnNumber}</span>
              {entry.events.length > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                  ⚡ {entry.events.length} 이벤트
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-medium ${
                  entry.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {entry.scoreChange >= 0 ? '+' : ''}
                {entry.scoreChange}
              </span>
              <span className="text-gray-400">
                {expandedTurn === entry.turnNumber ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {/* Expanded Details */}
          {expandedTurn === entry.turnNumber && (
            <div className="p-4 border-t bg-gray-50 space-y-4">
              {/* Stats at this turn */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">턴 종료 시 스탯</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>💰 GDP: {(entry.statsSnapshot.gdp).toLocaleString()}</div>
                  <div>🏭 산업: {entry.statsSnapshot.industry}</div>
                  <div>⛏️ 자원: {entry.statsSnapshot.resources}</div>
                  <div>🔬 기술: {entry.statsSnapshot.techLevel}</div>
                  <div>📚 연구: {entry.statsSnapshot.research}</div>
                  <div>⚔️ 군사: {entry.statsSnapshot.military}</div>
                  <div>👥 인구: {entry.statsSnapshot.population}</div>
                  <div>😊 행복: {entry.statsSnapshot.happiness}</div>
                  <div>🤝 외교: {entry.statsSnapshot.diplomacy}</div>
                </div>
              </div>

              {/* Budget decision */}
              {entry.decision && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">예산 배분</h4>
                  <div className="flex gap-2 text-sm">
                    {Object.entries(entry.decision.budget).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-white rounded border">
                        {key}: {value}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active policies */}
              {entry.decision && entry.decision.activePolicies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    활성 정책 ({entry.decision.activePolicies.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {entry.decision.activePolicies.map((policyId) => (
                      <span
                        key={policyId}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {policyId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {entry.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">발생 이벤트</h4>
                  <div className="space-y-1">
                    {entry.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          {event.category}
                        </span>
                        <span>{event.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-400">
                정산 시간: {new Date(entry.processedAt).toLocaleString('ko-KR')}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
