'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore, fetchSession } from '@/stores/gameStore';
import { StatsDisplay, StatsGrid } from '@/components/game/StatsDisplay';
import { BudgetSlider } from '@/components/game/BudgetSlider';
import { PolicySelector } from '@/components/game/PolicySelector';
import { NationStats, Direction, PolicyCategory } from '@/types/game';

interface PolicyCard {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  effects: { stat: string; type: string; value: number }[];
  conditions?: { stat: string; operator: string; value: number }[];
}

interface ActiveEvent {
  id: string;
  remainingDuration: number;
  definition: {
    name: string;
    category: string;
  };
}

interface GameSessionFull {
  id: string;
  direction: Direction;
  currentStats: NationStats;
  currentTurn: number;
  totalScore: number;
  status: string;
  nationTemplate?: {
    id: string;
    displayName: string;
  };
  season?: {
    id: string;
    name: string;
  };
  challenge?: {
    title: string;
    turnLimit: number;
  };
  eventInstances?: ActiveEvent[];
}

const DIRECTION_LABELS: Record<Direction, string> = {
  INDUSTRY: '🏭 산업 노선',
  FINANCE: '💹 금융 노선',
  MILITARY: '⚔️ 군사 노선',
  TECH: '🔬 기술 노선',
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    budget,
    selectedPolicies,
    resetTurnInput,
    isLoading,
    setLoading,
    error,
    setError,
  } = useGameStore();

  const [session, setSession] = useState<GameSessionFull | null>(null);
  const [policyCards, setPolicyCards] = useState<PolicyCard[]>([]);
  const [hasSubmittedTurn, setHasSubmittedTurn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGameData();
    return () => {
      resetTurnInput();
    };
  }, [id]);

  const loadGameData = async () => {
    setLoading(true);
    try {
      const [sessionData, cardsData, turnData] = await Promise.all([
        fetchSession(id),
        fetch('/api/game/policy-cards').then((res) => res.json()),
        fetch(`/api/game/sessions/${id}/turn`).then((res) => res.json()),
      ]);

      setSession(sessionData as GameSessionFull);
      setPolicyCards(cardsData.cards || []);
      setHasSubmittedTurn(turnData.hasSubmittedCurrentTurn || false);
    } catch (err) {
      setError('게임 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTurn = async () => {
    if (isSubmitting || hasSubmittedTurn) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/game/sessions/${id}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget,
          activePolicies: selectedPolicies,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '턴 제출에 실패했습니다.');
      }

      setHasSubmittedTurn(true);
      alert(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '턴 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-gray-500">게임 세션을 찾을 수 없습니다.</div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-600 underline"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }
  const isGameActive = session.status === 'ACTIVE';
  const canSubmit = isGameActive && !hasSubmittedTurn && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">
              {session.nationTemplate?.displayName || '국가'}
            </h1>
            <p className="text-sm text-gray-500">
              {DIRECTION_LABELS[session.direction]} · {session.season?.name || 'S1'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              턴 {session.currentTurn}
            </div>
            <div className="text-sm text-gray-500">
              총 점수: {session.totalScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Turn Status */}
        {isGameActive && (
          <div className={`mt-3 p-2 rounded-lg text-sm ${
            hasSubmittedTurn
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {hasSubmittedTurn
              ? '✅ 이번 턴 결정을 제출했습니다. 정산은 자정에 진행됩니다.'
              : '⏳ 이번 턴 결정을 아직 제출하지 않았습니다.'}
          </div>
        )}

        {!isGameActive && (
          <div className="mt-3 p-2 rounded-lg text-sm bg-gray-50 text-gray-700">
            게임이 종료되었습니다.
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            닫기
          </button>
        </div>
      )}

      {/* Active Events */}
      {session.eventInstances && session.eventInstances.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2">⚡ 진행 중인 이벤트</h3>
          <div className="space-y-2">
            {session.eventInstances.map((event) => (
              <div key={event.id} className="flex justify-between items-center text-sm">
                <span>{event.definition.name}</span>
                <span className="text-orange-600">
                  {event.remainingDuration}턴 남음
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">국가 현황</h2>
        <StatsGrid stats={session.currentStats} />
      </div>

      {/* Turn Input (Only for active games) */}
      {isGameActive && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Budget */}
            <BudgetSlider disabled={hasSubmittedTurn} />

            {/* Policies */}
            <PolicySelector
              policyCards={policyCards}
              disabled={hasSubmittedTurn}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              대시보드로
            </button>
            <button
              onClick={handleSubmitTurn}
              disabled={!canSubmit}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '제출 중...' : hasSubmittedTurn ? '제출 완료' : '턴 제출'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
