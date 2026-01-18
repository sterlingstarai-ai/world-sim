'use client';

import { Budget } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';

const BUDGET_CONFIG = {
  economy: { label: '경제', icon: '💰', color: 'bg-yellow-500' },
  welfare: { label: '복지', icon: '🏥', color: 'bg-green-500' },
  research: { label: '연구', icon: '🔬', color: 'bg-blue-500' },
  military: { label: '군사', icon: '⚔️', color: 'bg-red-500' },
  diplomacy: { label: '외교', icon: '🤝', color: 'bg-purple-500' },
};

interface BudgetSliderProps {
  disabled?: boolean;
}

export function BudgetSlider({ disabled = false }: BudgetSliderProps) {
  const { budget, updateBudgetCategory } = useGameStore();

  const total = Object.values(budget).reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">예산 배분</h3>
        <span className={`text-sm font-medium ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
          합계: {total}%
        </span>
      </div>

      <div className="space-y-4">
        {(Object.keys(BUDGET_CONFIG) as (keyof Budget)[]).map((category) => {
          const config = BUDGET_CONFIG[category];
          return (
            <div key={category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {config.icon} {config.label}
                </span>
                <span className="text-sm font-bold">{budget[category]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={budget[category]}
                onChange={(e) => updateBudgetCategory(category, parseInt(e.target.value))}
                disabled={disabled}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  disabled ? 'opacity-50' : ''
                }`}
                style={{
                  background: `linear-gradient(to right, ${
                    config.color.replace('bg-', '')
                  } 0%, ${config.color.replace('bg-', '')} ${budget[category]}%, #e5e7eb ${
                    budget[category]
                  }%, #e5e7eb 100%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Visual breakdown */}
      <div className="mt-4 h-4 rounded-full overflow-hidden flex">
        {(Object.keys(BUDGET_CONFIG) as (keyof Budget)[]).map((category) => {
          const config = BUDGET_CONFIG[category];
          return (
            <div
              key={category}
              className={`${config.color} transition-all duration-200`}
              style={{ width: `${budget[category]}%` }}
              title={`${config.label}: ${budget[category]}%`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        {(Object.keys(BUDGET_CONFIG) as (keyof Budget)[]).map((category) => {
          const config = BUDGET_CONFIG[category];
          return (
            <span key={category}>
              {config.icon} {budget[category]}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
