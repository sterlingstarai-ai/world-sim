'use client';

import { useState } from 'react';
import { Direction } from '@/types/game';

interface NationTemplate {
  id: string;
  name: string;
  displayName: string;
  initialStats: Record<string, number>;
}

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nationTemplateId: string; direction: Direction }) => void;
  nationTemplates: NationTemplate[];
  isLoading?: boolean;
}

const DIRECTION_OPTIONS: { value: Direction; label: string; icon: string; description: string }[] = [
  {
    value: 'INDUSTRY',
    label: '산업 노선',
    icon: '🏭',
    description: '산업력 +20, 자원 +10',
  },
  {
    value: 'FINANCE',
    label: '금융 노선',
    icon: '💹',
    description: 'GDP +50, 외교력 +10',
  },
  {
    value: 'MILITARY',
    label: '군사 노선',
    icon: '⚔️',
    description: '군사력 +20, 산업력 +10',
  },
  {
    value: 'TECH',
    label: '기술 노선',
    icon: '🔬',
    description: '기술력 +15, 연구력 +20',
  },
];

export function NewGameModal({
  isOpen,
  onClose,
  onSubmit,
  nationTemplates,
  isLoading = false,
}: NewGameModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedTemplate && selectedDirection) {
      onSubmit({
        nationTemplateId: selectedTemplate,
        direction: selectedDirection,
      });
    }
  };

  const canSubmit = selectedTemplate && selectedDirection && !isLoading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">새 게임 시작</h2>
          <p className="text-sm text-gray-500 mt-1">국가와 노선을 선택하세요</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Nation Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              국가 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {nationTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{template.displayName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    GDP: {template.initialStats.gdp}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              발전 노선
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDirection(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedDirection === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">
                    {option.icon} {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? '생성 중...' : '게임 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
