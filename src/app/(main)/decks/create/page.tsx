'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  WELFARE: 'bg-pink-100 text-pink-800 border-pink-300',
  TECH: 'bg-purple-100 text-purple-800 border-purple-300',
  MILITARY: 'bg-red-100 text-red-800 border-red-300',
  DIPLOMACY: 'bg-blue-100 text-blue-800 border-blue-300',
  RISK: 'bg-gray-100 text-gray-800 border-gray-300',
};

const categoryLabels: Record<string, string> = {
  ECONOMY: '경제',
  WELFARE: '복지',
  TECH: '기술',
  MILITARY: '군사',
  DIPLOMACY: '외교',
  RISK: '리스크',
};

export default function CreateDeckPage() {
  const router = useRouter();
  const [allCards, setAllCards] = useState<PolicyCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const res = await fetch('/api/game/policy-cards');
      const data = await res.json();
      setAllCards(data.cards || []);
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  }

  function toggleCard(cardId: string) {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter((id) => id !== cardId));
    } else if (selectedCards.length < 8) {
      setSelectedCards([...selectedCards, cardId]);
    }
  }

  function moveCard(cardId: string, direction: 'up' | 'down') {
    const index = selectedCards.indexOf(cardId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedCards.length) return;

    const newCards = [...selectedCards];
    [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
    setSelectedCards(newCards);
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean = false) {
    e.preventDefault();

    if (!name || selectedCards.length === 0) {
      alert('덱 이름과 최소 1장의 카드를 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const priorities: Record<string, number> = {};
      selectedCards.forEach((cardId, index) => {
        priorities[cardId] = index + 1;
      });

      const res = await fetch('/api/ugc/policy-decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          policyCardIds: selectedCards,
          priorities,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '덱 생성에 실패했습니다.');
        return;
      }

      const data = await res.json();

      if (publish) {
        await fetch(`/api/ugc/policy-decks/${data.policyDeck.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PUBLISHED' }),
        });
      }

      router.push('/decks');
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('덱 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCards = categoryFilter
    ? allCards.filter((c) => c.category === categoryFilter)
    : allCards;

  const selectedCardObjects = selectedCards
    .map((id) => allCards.find((c) => c.id === id))
    .filter(Boolean) as PolicyCard[];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link href="/decks" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; 덱 목록
      </Link>

      <h1 className="text-2xl font-bold mb-6">정책 덱 만들기</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Card Selection */}
        <div>
          <h2 className="font-semibold mb-3">카드 선택 ({selectedCards.length}/8)</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1 rounded text-sm ${
                categoryFilter === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-3 py-1 rounded text-sm ${
                  categoryFilter === key ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
            {filteredCards.map((card) => {
              const isSelected = selectedCards.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  disabled={!isSelected && selectedCards.length >= 8}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `${categoryColors[card.category]} border-2`
                      : 'bg-white hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{card.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[card.category]}`}>
                      {categoryLabels[card.category]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Deck Preview & Form */}
        <div>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">덱 이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="나만의 덱 이름"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="덱 전략 설명"
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selected Cards Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택된 카드 (우선순위 순)
              </label>
              {selectedCardObjects.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  왼쪽에서 카드를 선택하세요
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCardObjects.map((card, index) => (
                    <div
                      key={card.id}
                      className={`flex items-center gap-2 p-2 rounded border ${categoryColors[card.category]}`}
                    >
                      <span className="text-xs font-bold w-5">#{index + 1}</span>
                      <span className="flex-1 font-medium text-sm">{card.name}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveCard(card.id, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-xs bg-white/50 rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCard(card.id, 'down')}
                          disabled={index === selectedCardObjects.length - 1}
                          className="px-2 py-1 text-xs bg-white/50 rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCard(card.id)}
                          className="px-2 py-1 text-xs bg-white/50 rounded text-red-600"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || selectedCards.length === 0}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '임시 저장'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading || selectedCards.length === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '공개하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
