import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { NationStats, EventTrigger, EventEffect, EventCategory } from '@/types/game';
import { applyEffects, applyStatBounds } from './statsCalculator';

interface EventDefinitionData {
  id: string;
  name: string;
  category: EventCategory;
  triggers: EventTrigger[];
  effects: EventEffect[];
  duration: number;
}

interface TriggeredEvent {
  definition: EventDefinitionData;
  appliedEffects: EventEffect[];
}

/**
 * Check if a single trigger condition is met
 */
function checkTrigger(trigger: EventTrigger, stats: NationStats, turn: number): boolean {
  switch (trigger.type) {
    case 'STAT_THRESHOLD': {
      if (!trigger.stat || trigger.operator === undefined || trigger.value === undefined) {
        return false;
      }
      const statValue = stats[trigger.stat];
      switch (trigger.operator) {
        case 'GT':
          return statValue > trigger.value;
        case 'GTE':
          return statValue >= trigger.value;
        case 'LT':
          return statValue < trigger.value;
        case 'LTE':
          return statValue <= trigger.value;
        case 'EQ':
          return statValue === trigger.value;
        default:
          return false;
      }
    }
    case 'TURN_NUMBER': {
      if (trigger.value === undefined) return false;
      return turn === trigger.value;
    }
    case 'RANDOM': {
      if (trigger.probability === undefined) return false;
      return Math.random() < trigger.probability;
    }
    case 'POLICY_ACTIVE': {
      // This would need access to active policies - simplified for now
      return false;
    }
    default:
      return false;
  }
}

/**
 * Check if all triggers for an event are met
 */
function checkEventTriggers(
  triggers: EventTrigger[],
  stats: NationStats,
  turn: number
): boolean {
  if (triggers.length === 0) return false;

  // All triggers must be met (AND logic)
  // But RANDOM triggers are optional modifiers
  const nonRandomTriggers = triggers.filter((t) => t.type !== 'RANDOM');
  const randomTriggers = triggers.filter((t) => t.type === 'RANDOM');

  // Check non-random triggers first
  const nonRandomMet =
    nonRandomTriggers.length === 0 ||
    nonRandomTriggers.every((t) => checkTrigger(t, stats, turn));

  if (!nonRandomMet) return false;

  // If there are random triggers, at least one must pass
  if (randomTriggers.length > 0) {
    return randomTriggers.some((t) => checkTrigger(t, stats, turn));
  }

  return true;
}

/**
 * Find and trigger events based on current game state
 */
export async function findTriggeredEvents(
  sessionId: string,
  stats: NationStats,
  turn: number
): Promise<TriggeredEvent[]> {
  // Get all active event definitions
  const eventDefinitions = await prisma.eventDefinition.findMany({
    where: { isActive: true },
  });

  // Get already active events for this session (to avoid duplicate triggers)
  const activeEvents = await prisma.eventInstance.findMany({
    where: {
      sessionId,
      remainingDuration: { gt: 0 },
    },
    select: { definitionId: true },
  });
  const activeEventIds = new Set(activeEvents.map((e) => e.definitionId));

  const triggeredEvents: TriggeredEvent[] = [];

  for (const def of eventDefinitions) {
    // Skip if event is already active
    if (activeEventIds.has(def.id)) continue;

    const triggers = def.triggers as unknown as EventTrigger[];
    if (checkEventTriggers(triggers, stats, turn)) {
      triggeredEvents.push({
        definition: {
          id: def.id,
          name: def.name,
          category: def.category as EventCategory,
          triggers,
          effects: def.effects as unknown as EventEffect[],
          duration: def.duration,
        },
        appliedEffects: def.effects as unknown as EventEffect[],
      });
    }
  }

  return triggeredEvents;
}

/**
 * Apply event effects to stats
 */
export function applyEventEffects(
  stats: NationStats,
  events: TriggeredEvent[]
): { newStats: NationStats; totalEffects: Partial<NationStats> } {
  const currentStats = { ...stats };
  const totalEffects: Partial<NationStats> = {};

  for (const event of events) {
    for (const effect of event.appliedEffects) {
      const stat = effect.stat as keyof NationStats;
      let change = 0;

      if (effect.type === 'ADD') {
        change = effect.value;
      } else if (effect.type === 'MULTIPLY') {
        change = Math.round(currentStats[stat] * (effect.value - 1));
      } else if (effect.type === 'SET') {
        change = effect.value - currentStats[stat];
      }

      currentStats[stat] = currentStats[stat] + change;
      totalEffects[stat] = (totalEffects[stat] || 0) + change;
    }
  }

  return {
    newStats: applyStatBounds(currentStats),
    totalEffects,
  };
}

/**
 * Process events for a session during settlement
 */
export async function processSessionEvents(
  sessionId: string,
  snapshotId: string,
  stats: NationStats,
  turn: number
): Promise<{
  triggeredEvents: TriggeredEvent[];
  newStats: NationStats;
  eventInstances: { id: string; name: string; duration: number }[];
}> {
  // Find triggered events
  const triggeredEvents = await findTriggeredEvents(sessionId, stats, turn);

  // Apply event effects
  const { newStats, totalEffects } = applyEventEffects(stats, triggeredEvents);

  // Create event instances in database
  const eventInstances: { id: string; name: string; duration: number }[] = [];

  for (const event of triggeredEvents) {
    const instance = await prisma.eventInstance.create({
      data: {
        definitionId: event.definition.id,
        snapshotId,
        sessionId,
        turnNumber: turn,
        appliedEffects: event.appliedEffects as unknown as Prisma.InputJsonValue,
        remainingDuration: event.definition.duration,
      },
    });

    eventInstances.push({
      id: instance.id,
      name: event.definition.name,
      duration: event.definition.duration,
    });
  }

  // Update remaining duration for existing events
  await prisma.eventInstance.updateMany({
    where: {
      sessionId,
      remainingDuration: { gt: 0 },
    },
    data: {
      remainingDuration: { decrement: 1 },
    },
  });

  return {
    triggeredEvents,
    newStats,
    eventInstances,
  };
}

/**
 * Get active events for a session
 */
export async function getActiveEvents(sessionId: string): Promise<
  {
    id: string;
    name: string;
    category: string;
    remainingDuration: number;
    effects: EventEffect[];
  }[]
> {
  const activeEvents = await prisma.eventInstance.findMany({
    where: {
      sessionId,
      remainingDuration: { gt: 0 },
    },
    include: {
      definition: true,
    },
  });

  return activeEvents.map((event) => ({
    id: event.id,
    name: event.definition.name,
    category: event.definition.category,
    remainingDuration: event.remainingDuration,
    effects: event.appliedEffects as unknown as EventEffect[],
  }));
}
