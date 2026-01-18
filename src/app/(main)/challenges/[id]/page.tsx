'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  turnLimit: number;
  status: string;
  constraints: Array<{
    type: string;
    stat?: string;
    budgetCategory?: string;
    operator?: string;
    value?: number;
    policyId?: string;
  }>;
  winConditions: Array<{
    type: string;
    stat?: string;
    operator?: string;
    value: number;
  }>;
  creator: {
    id: string;
    nickname: string | null;
  };
  startNationTemplate: {
    id: string;
    displayName: string;
    initialStats: Record<string, number>;
  };
  _count: {
    gameSessions: number;
  };
}

const difficultyColors: Record<string, string> = {
  EASY: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HARD: 'bg-orange-100 text-orange-800',
  EXTREME: 'bg-red-100 text-red-800',
};

const difficultyLabels: Record<string, string> = {
  EASY: '쉬움',
  NORMAL: '보통',
  HARD: '어려움',
  EXTREME: '극한',
};

const operatorLabels: Record<string, string> = {
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  EQ: '=',
};

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadChallenge();
  }, [id]);

  async function loadChallenge() {
    try {
      const res = await fetch(`/api/ugc/challenges/${id}`);
      if (!res.ok) throw new Error('Challenge not found');
      const data = await res.json();
      setChallenge(data.challenge);
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function startChallenge() {
    if (!challenge) return;

    try {
      setIsStarting(true);
      const res = await fetch('/api/game/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationTemplateId: challenge.startNationTemplate.id,
          direction: 'INDUSTRY',
          challengeId: challenge.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '게임 시작에 실패했습니다.');
        return;
      }

      const data = await res.json();
      router.push(`/game/${data.session.id}`);
    } catch (error) {
      console.error('Failed to start challenge:', error);
      alert('게임 시작에 실패했습니다.');
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">챌린지를 찾을 수 없습니다</h1>
        <Link href="/challenges" className="text-blue-600 hover:underline">
          챌린지 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/challenges" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; 챌린지 목록
      </Link>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>by {challenge.creator.nickname || '익명'}</span>
              <span>|</span>
              <span>{challenge._count.gameSessions}회 플레이</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${difficultyColors[challenge.difficulty]}`}>
            {difficultyLabels[challenge.difficulty]}
          </span>
        </div>

        {challenge.description && <p className="text-gray-600 mb-6">{challenge.description}</p>}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">시작 국가</h3>
            <p className="text-lg">{challenge.startNationTemplate.displayName}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">턴 제한</h3>
            <p className="text-lg">{challenge.turnLimit}턴</p>
          </div>
        </div>

        {/* Win Conditions */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">승리 조건</h3>
          <ul className="space-y-2">
            {challenge.winConditions.map((condition, index) => (
              <li key={index} className="flex items-center gap-2 text-sm bg-green-50 text-green-800 px-3 py-2 rounded">
                {condition.type === 'STAT_TARGET' && (
                  <>
                    <span className="font-medium">{condition.stat}</span>
                    <span>{operatorLabels[condition.operator || 'GTE']}</span>
                    <span>{condition.value}</span>
                  </>
                )}
                {condition.type === 'SURVIVE_TURNS' && <span>{condition.value}턴 생존</span>}
                {condition.type === 'SCORE_TARGET' && <span>점수 {condition.value} 달성</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Constraints */}
        {challenge.constraints.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">제약 조건</h3>
            <ul className="space-y-2">
              {challenge.constraints.map((constraint, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm bg-orange-50 text-orange-800 px-3 py-2 rounded"
                >
                  {constraint.type === 'STAT_LIMIT' && (
                    <>
                      <span className="font-medium">{constraint.stat}</span>
                      <span>{operatorLabels[constraint.operator || 'LTE']}</span>
                      <span>{constraint.value}</span>
                    </>
                  )}
                  {constraint.type === 'BUDGET_LOCK' && (
                    <span>{constraint.budgetCategory} 예산 고정: {constraint.value}%</span>
                  )}
                  {constraint.type === 'POLICY_REQUIRED' && <span>필수 정책: {constraint.policyId}</span>}
                  {constraint.type === 'POLICY_BANNED' && <span>금지 정책: {constraint.policyId}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={startChallenge}
          disabled={isStarting}
          className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
            isStarting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isStarting ? '시작하는 중...' : '챌린지 시작하기'}
        </button>
      </div>
    </div>
  );
}
