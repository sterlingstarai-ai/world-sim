'use client';

import { useEffect, useState } from 'react';
import { useGameStore, fetchSessions, createSession, abandonSession } from '@/stores/gameStore';
import { SessionCard } from '@/components/game/SessionCard';
import { NewGameModal } from '@/components/game/NewGameModal';
import { Direction } from '@/types/game';

interface NationTemplate {
  id: string;
  name: string;
  displayName: string;
  initialStats: Record<string, number>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionData = any;

export default function DashboardPage() {
  const { isLoading, setLoading, error, setError } = useGameStore();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nationTemplates, setNationTemplates] = useState<NationTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsData, templatesData] = await Promise.all([
        fetchSessions(),
        fetch('/api/game/nation-templates').then((res) => res.json()),
      ]);
      setSessions(sessionsData);
      setNationTemplates(templatesData.templates || []);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (data: { nationTemplateId: string; direction: Direction }) => {
    setIsCreating(true);
    try {
      const newSession = await createSession(data);
      setSessions([newSession, ...sessions]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게임 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAbandon = async (id: string) => {
    if (!confirm('정말 게임을 포기하시겠습니까?')) return;

    try {
      await abandonSession(id);
      setSessions(
        sessions.map((s: SessionData) => (s.id === id ? { ...s, status: 'ABANDONED' } : s))
      );
    } catch (err) {
      setError('게임 포기에 실패했습니다.');
      console.error(err);
    }
  };

  const activeSessions = sessions.filter((s: SessionData) => s.status === 'ACTIVE');
  const completedSessions = sessions.filter((s: SessionData) => s.status !== 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500">게임 세션을 관리하세요</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + 새 게임
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            닫기
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">불러오는 중...</div>
      )}

      {/* Active Sessions */}
      {!isLoading && (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3">
              진행 중인 게임 ({activeSessions.length})
            </h2>
            {activeSessions.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500 border">
                진행 중인 게임이 없습니다.
                <br />
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-blue-600 underline mt-2"
                >
                  새 게임 시작하기
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onAbandon={handleAbandon}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                완료/포기한 게임 ({completedSessions.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {completedSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* New Game Modal */}
      <NewGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGame}
        nationTemplates={nationTemplates}
        isLoading={isCreating}
      />
    </div>
  );
}
