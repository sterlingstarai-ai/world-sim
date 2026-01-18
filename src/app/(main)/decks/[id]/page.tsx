'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface PolicyCard {
  id: string;
  name: string;
  category: string;
  description: string;
  effects: Array<{
    stat: string;
    type: string;
    value: number;
  }>;
}

interface PolicyDeck {
  id: string;
  name: string;
  description: string | null;
  status: string;
  creator: {
    id: string;
    nickname: string | null;
  };
  deckCards: Array<{
    priority: number;
    card: PolicyCard;
  }>;
  likeCount: number;
  copyCount: number;
}

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  WELFARE: 'bg-pink-100 text-pink-800 border-pink-200',
  TECH: 'bg-purple-100 text-purple-800 border-purple-200',
  MILITARY: 'bg-red-100 text-red-800 border-red-200',
  DIPLOMACY: 'bg-blue-100 text-blue-800 border-blue-200',
  RISK: 'bg-gray-100 text-gray-800 border-gray-200',
};

const categoryLabels: Record<string, string> = {
  ECONOMY: '경제',
  WELFARE: '복지',
  TECH: '기술',
  MILITARY: '군사',
  DIPLOMACY: '외교',
  RISK: '리스크',
};

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deck, setDeck] = useState<PolicyDeck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDeck();
  }, [id]);

  async function loadDeck() {
    try {
      const res = await fetch(`/api/ugc/policy-decks/${id}`);
      if (!res.ok) throw new Error('Deck not found');
      const data = await res.json();
      setDeck(data.policyDeck);
    } catch (error) {
      console.error('Failed to load deck:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLike() {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/ugc/policy-decks/${id}?action=like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        loadDeck(); // Refresh count
      }
    } catch (error) {
      console.error('Failed to like:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopy() {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/ugc/policy-decks/${id}?action=copy`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('덱이 복사되었습니다!');
        loadDeck();
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">덱을 찾을 수 없습니다</h1>
        <Link href="/decks" className="text-blue-600 hover:underline">
          덱 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/decks" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; 덱 목록
      </Link>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{deck.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>by {deck.creator.nickname || '익명'}</span>
              <span>|</span>
              <span>{deck.deckCards.length}장</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isLiked
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isLiked ? '♥' : '♡'} {deck.likeCount}
            </button>
            <button
              onClick={handleCopy}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              복사하기
            </button>
          </div>
        </div>

        {deck.description && <p className="text-gray-600 mb-6">{deck.description}</p>}

        {/* Cards */}
        <h3 className="font-semibold mb-4">포함된 정책 카드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deck.deckCards
            .sort((a, b) => a.priority - b.priority)
            .map((deckCard, index) => (
              <div
                key={deckCard.card.id}
                className={`rounded-lg border p-4 ${categoryColors[deckCard.card.category]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{deckCard.card.name}</span>
                  <span className="text-xs opacity-70">#{index + 1}</span>
                </div>
                <p className="text-sm opacity-80 mb-2">{deckCard.card.description}</p>
                <div className="flex flex-wrap gap-1">
                  {deckCard.card.effects.map((effect, i) => (
                    <span key={i} className="text-xs bg-white/50 px-2 py-0.5 rounded">
                      {effect.stat} {effect.type === 'ADD' ? (effect.value >= 0 ? '+' : '') : 'x'}
                      {effect.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
