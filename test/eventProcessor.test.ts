import test from 'node:test';
import assert from 'node:assert/strict';

import { processSessionEvents, EventDbClient } from '../src/game/engine/eventProcessor';
import { DEFAULT_STATS } from '../src/types/game';

test('processSessionEvents: duration decrement only targets existing events (turnNumber < turn)', async () => {
  const updateManyCalls: unknown[] = [];

  const fakeDb: EventDbClient = {
    eventDefinition: {
      findMany: async () => [],
    },
    eventInstance: {
      findMany: async () => [],
      create: async () => {
        throw new Error('create should not be called when no events are triggered');
      },
      updateMany: async (args: unknown) => {
        updateManyCalls.push(args);
        return { count: 0 };
      },
    },
  };

  await processSessionEvents('session-1', 'snapshot-1', DEFAULT_STATS, 5, fakeDb);

  // Verify updateMany was called with the correct where clause
  assert.equal(updateManyCalls.length, 1);

  const updateCall = updateManyCalls[0] as { where: { turnNumber?: { lt: number } } };
  assert.ok(updateCall.where.turnNumber, 'updateMany should include turnNumber filter');
  assert.deepEqual(updateCall.where.turnNumber, { lt: 5 }, 'turnNumber filter should be { lt: turn }');
});

test('processSessionEvents: new events are created with full duration (not decremented)', async () => {
  const createdEvents: unknown[] = [];
  const updateManyCalls: unknown[] = [];

  const fakeEventDefinition = {
    id: 'event-def-1',
    name: 'Test Event',
    category: 'ECONOMY',
    triggers: [{ type: 'TURN_NUMBER', value: 5 }],
    effects: [{ stat: 'gdp', type: 'ADD', value: 100 }],
    duration: 3,
    isActive: true,
  };

  const fakeDb: EventDbClient = {
    eventDefinition: {
      findMany: async () => [fakeEventDefinition],
    },
    eventInstance: {
      findMany: async () => [],
      create: async (args: unknown) => {
        createdEvents.push(args);
        return { id: 'instance-1' };
      },
      updateMany: async (args: unknown) => {
        updateManyCalls.push(args);
        return { count: 0 };
      },
    },
  };

  const result = await processSessionEvents('session-1', 'snapshot-1', DEFAULT_STATS, 5, fakeDb);

  // Verify event was triggered and created
  assert.equal(result.eventInstances.length, 1);
  assert.equal(result.eventInstances[0].duration, 3, 'Event should have full duration');

  // Verify create was called with full duration
  assert.equal(createdEvents.length, 1);
  const createCall = createdEvents[0] as { data: { remainingDuration: number; turnNumber: number } };
  assert.equal(createCall.data.remainingDuration, 3, 'remainingDuration should be full duration');
  assert.equal(createCall.data.turnNumber, 5, 'turnNumber should be current turn');

  // Verify updateMany excludes the current turn
  assert.equal(updateManyCalls.length, 1);
  const updateCall = updateManyCalls[0] as { where: { turnNumber?: { lt: number } } };
  assert.deepEqual(updateCall.where.turnNumber, { lt: 5 }, 'Should not decrement events created this turn');
});

test('processSessionEvents: event effects are applied to stats', async () => {
  const fakeEventDefinition = {
    id: 'event-def-1',
    name: 'GDP Boost Event',
    category: 'ECONOMY',
    triggers: [{ type: 'TURN_NUMBER', value: 1 }],
    effects: [{ stat: 'gdp', type: 'ADD', value: 50 }],
    duration: 2,
    isActive: true,
  };

  const fakeDb: EventDbClient = {
    eventDefinition: {
      findMany: async () => [fakeEventDefinition],
    },
    eventInstance: {
      findMany: async () => [],
      create: async () => ({ id: 'instance-1' }),
      updateMany: async () => ({ count: 0 }),
    },
  };

  const initialStats = { ...DEFAULT_STATS, gdp: 100 };
  const result = await processSessionEvents('session-1', 'snapshot-1', initialStats, 1, fakeDb);

  // Verify GDP was increased by event effect
  assert.equal(result.newStats.gdp, 150, 'GDP should be increased by event effect');
});
