'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  turnLimit: number;
  status: string;
  creator: {
    id: string;
    nickname: string | null;
  };
  startNationTemplate: {
    id: string;
    displayName: string;
  };
  _count: {
    gameSessions: number;
  };
  createdAt: string;
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

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>('');

  useEffect(() => {
    loadChallenges();
  }, [difficulty]);

  async function loadChallenges() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ status: 'PUBLISHED' });
      if (difficulty) params.set('difficulty', difficulty);

      const res = await fetch(`/api/ugc/challenges?${params}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">챌린지</h1>
          <p className="text-gray-500">다양한 챌린지에 도전해보세요</p>
        </div>
        <Link
          href="/challenges/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          챌린지 만들기
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setDifficulty('')}
          className={`px-3 py-1 rounded-full text-sm ${
            difficulty === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {Object.entries(difficultyLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setDifficulty(key)}
            className={`px-3 py-1 rounded-full text-sm ${
              difficulty === key ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Challenge List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 공개된 챌린지가 없습니다.</p>
          <Link href="/challenges/create" className="text-blue-600 hover:underline mt-2 inline-block">
            첫 번째 챌린지를 만들어보세요!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{challenge.title}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
                  {difficultyLabels[challenge.difficulty]}
                </span>
              </div>
              {challenge.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{challenge.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>시작: {challenge.startNationTemplate.displayName}</span>
                <span>{challenge.turnLimit}턴</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-gray-400">
                <span>by {challenge.creator.nickname || '익명'}</span>
                <span>{challenge._count.gameSessions}회 플레이</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
