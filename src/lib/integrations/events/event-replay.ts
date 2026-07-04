import { getAllEvents } from './event-store';
import crypto from 'crypto';
import { IntegrationEvent } from './event-schema';

export async function replayEvents(events?: IntegrationEvent[]) {
  const eventsToReplay = events || getAllEvents();
  
  const state: Record<string, any> = {};

  for (const event of eventsToReplay) {
    await processEvent(event, state);
  }

  return state;
}

export function computeStateHash(state: Record<string, any>): string {
  // Hash the state deterministically by sorting keys
  const sortedKeys = Object.keys(state).sort();
  const deterministicState: Record<string, any> = {};
  for (const k of sortedKeys) {
    deterministicState[k] = state[k];
  }
  return crypto.createHash('sha256').update(JSON.stringify(deterministicState)).digest('hex');
}

async function processEvent(event: IntegrationEvent, state: Record<string, any>) {
  if (event.type === 'issue.created') {
    state[event.payload.id] = { id: event.payload.id, ...event.payload };
  } else if (event.type === 'issue.updated') {
    if (state[event.payload.id]) {
      state[event.payload.id] = { ...state[event.payload.id], ...event.payload };
    }
  } else if (event.type === 'issue.deleted') {
    delete state[event.payload.id];
  }
}
