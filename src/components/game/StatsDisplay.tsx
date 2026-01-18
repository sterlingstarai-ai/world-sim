'use client';

import { NationStats } from '@/types/game';

interface StatsDisplayProps {
  stats: NationStats;
  previousStats?: NationStats;
  compact?: boolean;
}

const STAT_CONFIG = {
  gdp: { label: 'GDP', icon: '💰', color: 'text-yellow-600', max: 1000 },
  industry: { label: '산업력', icon: '🏭', color: 'text-gray-600', max: 100 },
  resources: { label: '자원', icon: '⛏️', color: 'text-amber-700', max: 100 },
  techLevel: { label: '기술', icon: '🔬', color: 'text-blue-600', max: 100 },
  research: { label: '연구', icon: '📚', color: 'text-purple-600', max: 100 },
  military: { label: '군사력', icon: '⚔️', color: 'text-red-600', max: 100 },
  population: { label: '인구', icon: '👥', color: 'text-green-600', max: 100 },
  happiness: { label: '행복도', icon: '😊', color: 'text-pink-500', max: 100 },
  diplomacy: { label: '외교력', icon: '🤝', color: 'text-teal-600', max: 100 },
};

function StatBar({
  stat,
  value,
  previousValue,
  config,
  compact,
}: {
  stat: keyof NationStats;
  value: number;
  previousValue?: number;
  config: (typeof STAT_CONFIG)[keyof typeof STAT_CONFIG];
  compact?: boolean;
}) {
  const percentage = Math.min((value / config.max) * 100, 100);
  const diff = previousValue !== undefined ? value - previousValue : 0;

  return (
    <div className={`${compact ? 'mb-1' : 'mb-3'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          {config.icon} {config.label}
        </span>
        <div className="flex items-center gap-1">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold ${config.color}`}>
            {stat === 'gdp' ? value.toLocaleString() : value}
          </span>
          {diff !== 0 && (
            <span
              className={`text-xs ${
                diff > 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              ({diff > 0 ? '+' : ''}{diff})
            </span>
          )}
        </div>
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${compact ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`${compact ? 'h-1.5' : 'h-2'} rounded-full transition-all duration-300 ${
            stat === 'gdp'
              ? 'bg-yellow-500'
              : stat === 'happiness'
              ? 'bg-pink-400'
              : stat === 'military'
              ? 'bg-red-500'
              : stat === 'diplomacy'
              ? 'bg-teal-500'
              : stat === 'techLevel' || stat === 'research'
              ? 'bg-blue-500'
              : 'bg-gray-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function StatsDisplay({ stats, previousStats, compact = false }: StatsDisplayProps) {
  const statKeys = Object.keys(STAT_CONFIG) as (keyof NationStats)[];

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
      {statKeys.map((stat) => (
        <StatBar
          key={stat}
          stat={stat}
          value={stats[stat]}
          previousValue={previousStats?.[stat]}
          config={STAT_CONFIG[stat]}
          compact={compact}
        />
      ))}
    </div>
  );
}

export function StatsGrid({ stats }: { stats: NationStats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {(Object.keys(STAT_CONFIG) as (keyof NationStats)[]).map((stat) => {
        const config = STAT_CONFIG[stat];
        return (
          <div key={stat} className="bg-white rounded-lg p-3 shadow-sm border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.icon}</span>
              <span className="text-xs text-gray-500">{config.label}</span>
            </div>
            <div className={`text-xl font-bold ${config.color}`}>
              {stat === 'gdp' ? stats[stat].toLocaleString() : stats[stat]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
