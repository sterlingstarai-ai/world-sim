'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { PolicyCategory } from '@/types/game';

interface PolicyCard {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  effects: { stat: string; type: string; value: number }[];
  conditions?: { stat: string; operator: string; value: number }[];
}

interface PolicySelectorProps {
  policyCards: PolicyCard[];
  disabled?: boolean;
}

const CATEGORY_CONFIG: Record<PolicyCategory, { label: string; icon: string; color: string }> = {
  ECONOMY: { label: '경제', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
  WELFARE: { label: '복지', icon: '🏥', color: 'bg-green-100 text-green-800' },
  TECH: { label: '기술', icon: '🔬', color: 'bg-blue-100 text-blue-800' },
  MILITARY: { label: '군사', icon: '⚔️', color: 'bg-red-100 text-red-800' },
  DIPLOMACY: { label: '외교', icon: '🤝', color: 'bg-purple-100 text-purple-800' },
  RISK: { label: '위험', icon: '⚠️', color: 'bg-orange-100 text-orange-800' },
};

function formatEffect(effect: { stat: string; type: string; value: number }): string {
  const sign = effect.value >= 0 ? '+' : '';
  return `${effect.stat} ${sign}${effect.value}`;
}

export function PolicySelector({ policyCards, disabled = false }: PolicySelectorProps) {
  const { selectedPolicies, togglePolicy } = useGameStore();
  const [activeCategory, setActiveCategory] = useState<PolicyCategory | 'ALL'>('ALL');

  const categories = Object.keys(CATEGORY_CONFIG) as PolicyCategory[];
  const filteredCards =
    activeCategory === 'ALL'
      ? policyCards
      : policyCards.filter((card) => card.category === activeCategory);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">정책 선택</h3>
        <span className="text-sm text-gray-500">
          {selectedPolicies.length}/8 선택
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'ALL'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {categories.map((category) => {
          const config = CATEGORY_CONFIG[category];
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.icon} {config.label}
            </button>
          );
        })}
      </div>

      {/* Policy Cards Grid */}
      <div className="grid gap-2 max-h-80 overflow-y-auto">
        {filteredCards.map((card) => {
          const config = CATEGORY_CONFIG[card.category];
          const isSelected = selectedPolicies.includes(card.id);
          const canSelect = selectedPolicies.length < 8 || isSelected;

          return (
            <button
              key={card.id}
              onClick={() => !disabled && canSelect && togglePolicy(card.id)}
              disabled={disabled || !canSelect}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : canSelect
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">{card.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{card.description}</p>
              <div className="flex flex-wrap gap-1">
                {card.effects.map((effect, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      effect.value >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {formatEffect(effect)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Policies Summary */}
      {selectedPolicies.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500 mb-2">선택된 정책:</div>
          <div className="flex flex-wrap gap-1">
            {selectedPolicies.map((policyId) => {
              const card = policyCards.find((c) => c.id === policyId);
              if (!card) return null;
              return (
                <span
                  key={policyId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {card.name}
                  {!disabled && (
                    <button
                      onClick={() => togglePolicy(policyId)}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
