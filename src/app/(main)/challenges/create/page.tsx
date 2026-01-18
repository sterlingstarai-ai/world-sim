'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NationTemplate {
  id: string;
  displayName: string;
}

type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

interface WinCondition {
  type: 'STAT_TARGET' | 'SURVIVE_TURNS' | 'SCORE_TARGET';
  stat?: string;
  operator?: string;
  value: number;
}

const statOptions = ['gdp', 'industry', 'resources', 'techLevel', 'research', 'military', 'population', 'happiness', 'diplomacy'];

export default function CreateChallengePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<NationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startNationTemplateId, setStartNationTemplateId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [turnLimit, setTurnLimit] = useState(30);
  const [winConditions, setWinConditions] = useState<WinCondition[]>([
    { type: 'STAT_TARGET', stat: 'gdp', operator: 'GTE', value: 200 },
  ]);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch('/api/game/nation-templates');
      const data = await res.json();
      setTemplates(data.templates || []);
      if (data.templates?.length > 0) {
        setStartNationTemplateId(data.templates[0].id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  function addWinCondition() {
    setWinConditions([...winConditions, { type: 'STAT_TARGET', stat: 'gdp', operator: 'GTE', value: 100 }]);
  }

  function removeWinCondition(index: number) {
    setWinConditions(winConditions.filter((_, i) => i !== index));
  }

  function updateWinCondition(index: number, updates: Partial<WinCondition>) {
    setWinConditions(winConditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean = false) {
    e.preventDefault();

    if (!title || !startNationTemplateId || winConditions.length === 0) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // Create challenge
      const res = await fetch('/api/ugc/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          startNationTemplateId,
          difficulty,
          turnLimit,
          winConditions,
          constraints: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '챌린지 생성에 실패했습니다.');
        return;
      }

      const data = await res.json();

      // Publish if requested
      if (publish) {
        await fetch(`/api/ugc/challenges/${data.challenge.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PUBLISHED' }),
        });
      }

      router.push('/challenges');
    } catch (error) {
      console.error('Failed to create challenge:', error);
      alert('챌린지 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/challenges" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; 챌린지 목록
      </Link>

      <h1 className="text-2xl font-bold mb-6">챌린지 만들기</h1>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="챌린지 제목"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="챌린지에 대한 설명"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Start Nation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작 국가 *</label>
          <select
            value={startNationTemplateId}
            onChange={(e) => setStartNationTemplateId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty & Turn Limit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="EASY">쉬움</option>
              <option value="NORMAL">보통</option>
              <option value="HARD">어려움</option>
              <option value="EXTREME">극한</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">턴 제한</label>
            <input
              type="number"
              value={turnLimit}
              onChange={(e) => setTurnLimit(parseInt(e.target.value) || 30)}
              min={5}
              max={100}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Win Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">승리 조건 *</label>
            <button type="button" onClick={addWinCondition} className="text-sm text-blue-600 hover:underline">
              + 조건 추가
            </button>
          </div>
          <div className="space-y-3">
            {winConditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <select
                  value={condition.type}
                  onChange={(e) => updateWinCondition(index, { type: e.target.value as WinCondition['type'] })}
                  className="px-2 py-1 border rounded"
                >
                  <option value="STAT_TARGET">스탯 목표</option>
                  <option value="SURVIVE_TURNS">생존 턴</option>
                  <option value="SCORE_TARGET">점수 목표</option>
                </select>

                {condition.type === 'STAT_TARGET' && (
                  <>
                    <select
                      value={condition.stat}
                      onChange={(e) => updateWinCondition(index, { stat: e.target.value })}
                      className="px-2 py-1 border rounded"
                    >
                      {statOptions.map((stat) => (
                        <option key={stat} value={stat}>
                          {stat}
                        </option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateWinCondition(index, { operator: e.target.value })}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="GTE">&gt;=</option>
                      <option value="GT">&gt;</option>
                      <option value="LTE">&lt;=</option>
                      <option value="LT">&lt;</option>
                      <option value="EQ">=</option>
                    </select>
                  </>
                )}

                <input
                  type="number"
                  value={condition.value}
                  onChange={(e) => updateWinCondition(index, { value: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 border rounded"
                />

                {winConditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWinCondition(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '임시 저장'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isLoading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '공개하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
