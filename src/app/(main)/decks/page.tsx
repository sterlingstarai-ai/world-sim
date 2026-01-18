'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PolicyCard {
  id: string;
  name: string;
  category: string;
  description: string;
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
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-yellow-100 text-yellow-800',
  WELFARE: 'bg-pink-100 text-pink-800',
  TECH: 'bg-purple-100 text-purple-800',
  MILITARY: 'bg-red-100 text-red-800',
  DIPLOMACY: 'bg-blue-100 text-blue-800',
  RISK: 'bg-gray-100 text-gray-800',
};

export default function PolicyDecksPage() {
  const [decks, setDecks] = useState<PolicyDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ugc/policy-decks?status=PUBLISHED');
      const data = await res.json();
      setDecks(data.policyDecks || []);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">정책 덱</h1>
          <p className="text-gray-500">다른 플레이어들이 만든 정책 덱을 살펴보세요</p>
        </div>
        <Link
          href="/decks/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          덱 만들기
        </Link>
      </div>

      {/* Deck List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-6 w-16 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 공개된 정책 덱이 없습니다.</p>
          <Link href="/decks/create" className="text-blue-600 hover:underline mt-2 inline-block">
            첫 번째 덱을 만들어보세요!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{deck.name}</h3>
                <span className="text-sm text-gray-500">{deck.deckCards.length}장</span>
              </div>

              {/* Card Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {deck.deckCards.slice(0, 4).map((card) => (
                  <span
                    key={card.card.id}
                    className={`px-2 py-0.5 rounded text-xs ${categoryColors[card.card.category]}`}
                  >
                    {card.card.name}
                  </span>
                ))}
                {deck.deckCards.length > 4 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    +{deck.deckCards.length - 4}
                  </span>
                )}
              </div>

              {deck.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deck.description}</p>}

              <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-400">
                <span>by {deck.creator.nickname || '익명'}</span>
                <div className="flex items-center gap-3">
                  <span>{deck.likeCount} 좋아요</span>
                  <span>{deck.copyCount} 복사</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
