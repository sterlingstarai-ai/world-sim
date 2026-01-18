import { create } from 'zustand';
import { NationStats, Budget, DEFAULT_BUDGET } from '@/types/game';

interface GameSession {
  id: string;
  nationTemplateId: string;
  direction: string;
  currentStats: NationStats;
  currentTurn: number;
  totalScore: number;
  status: string;
  nationTemplate?: {
    id: string;
    name: string;
    displayName: string;
  };
  season?: {
    id: string;
    name: string;
  };
}

interface ActiveEvent {
  id: string;
  name: string;
  category: string;
  remainingDuration: number;
  appliedEffects: unknown[];
}

interface GameState {
  // Session state
  currentSession: GameSession | null;
  sessions: GameSession[];
  isLoading: boolean;
  error: string | null;

  // Turn input state
  budget: Budget;
  selectedPolicies: string[];
  activeEvents: ActiveEvent[];

  // Actions
  setCurrentSession: (session: GameSession | null) => void;
  setSessions: (sessions: GameSession[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Budget actions
  setBudget: (budget: Budget) => void;
  updateBudgetCategory: (category: keyof Budget, value: number) => void;

  // Policy actions
  togglePolicy: (policyId: string) => void;
  setSelectedPolicies: (policies: string[]) => void;
  clearSelectedPolicies: () => void;

  // Event actions
  setActiveEvents: (events: ActiveEvent[]) => void;

  // Reset
  resetTurnInput: () => void;
  resetStore: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  budget: { ...DEFAULT_BUDGET },
  selectedPolicies: [],
  activeEvents: [],

  // Session actions
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Budget actions
  setBudget: (budget) => set({ budget }),
  updateBudgetCategory: (category, value) => {
    const { budget } = get();
    const currentValue = budget[category];
    const diff = value - currentValue;

    // Calculate remaining categories to adjust
    const otherCategories = Object.keys(budget).filter((k) => k !== category) as (keyof Budget)[];
    const totalOther = otherCategories.reduce((sum, cat) => sum + budget[cat], 0);

    if (totalOther === 0 && diff > 0) {
      // Can't increase if others are all 0
      return;
    }

    // Distribute the diff proportionally among other categories
    const newBudget = { ...budget, [category]: value };
    const adjustmentFactor = totalOther > 0 ? (totalOther - diff) / totalOther : 0;

    for (const cat of otherCategories) {
      newBudget[cat] = Math.max(0, Math.round(budget[cat] * adjustmentFactor));
    }

    // Ensure total is exactly 100
    const total = Object.values(newBudget).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      const adjustment = 100 - total;
      // Add adjustment to first non-zero other category
      for (const cat of otherCategories) {
        if (newBudget[cat] > 0 || adjustment > 0) {
          newBudget[cat] = Math.max(0, newBudget[cat] + adjustment);
          break;
        }
      }
    }

    set({ budget: newBudget });
  },

  // Policy actions
  togglePolicy: (policyId) => {
    const { selectedPolicies } = get();
    if (selectedPolicies.includes(policyId)) {
      set({ selectedPolicies: selectedPolicies.filter((id) => id !== policyId) });
    } else if (selectedPolicies.length < 8) {
      set({ selectedPolicies: [...selectedPolicies, policyId] });
    }
  },
  setSelectedPolicies: (policies) => set({ selectedPolicies: policies }),
  clearSelectedPolicies: () => set({ selectedPolicies: [] }),

  // Event actions
  setActiveEvents: (events) => set({ activeEvents: events }),

  // Reset actions
  resetTurnInput: () =>
    set({
      budget: { ...DEFAULT_BUDGET },
      selectedPolicies: [],
    }),
  resetStore: () =>
    set({
      currentSession: null,
      sessions: [],
      isLoading: false,
      error: null,
      budget: { ...DEFAULT_BUDGET },
      selectedPolicies: [],
      activeEvents: [],
    }),
}));

// API helper functions
export async function fetchSessions(): Promise<GameSession[]> {
  const response = await fetch('/api/game/sessions');
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const data = await response.json();
  return data.sessions;
}

export async function fetchSession(id: string): Promise<GameSession> {
  const response = await fetch(`/api/game/sessions/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  const data = await response.json();
  return data.session;
}

export async function createSession(input: {
  nationTemplateId: string;
  direction: string;
  challengeId?: string;
  mapSeedId?: string;
}): Promise<GameSession> {
  const response = await fetch('/api/game/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }
  const data = await response.json();
  return data.session;
}

export async function abandonSession(id: string): Promise<GameSession> {
  const response = await fetch(`/api/game/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ABANDONED' }),
  });
  if (!response.ok) {
    throw new Error('Failed to abandon session');
  }
  const data = await response.json();
  return data.session;
}
