import { IntegrationEvent } from './src/lib/integrations/events/event-schema';
import { replayEvents, computeStateHash } from './src/lib/integrations/events/event-replay';

async function runTest() {
  console.log("=== Testing Event Replay Determinism ===");

  // Generate 1000 deterministic events
  const events: IntegrationEvent[] = [];
  for (let i = 0; i < 500; i++) {
    events.push({
      eventId: `EVT-${i}`, provider: 'SYSTEM', type: 'issue.created', timestamp: 'now',
      payload: { id: `T-${i}`, title: `Task ${i}`, status: 'TODO' }
    });
  }
  for (let i = 0; i < 500; i++) {
    events.push({
      eventId: `EVT-UPD-${i}`, provider: 'SYSTEM', type: 'issue.updated', timestamp: 'now',
      payload: { id: `T-${i}`, status: i % 2 === 0 ? 'DONE' : 'IN_PROGRESS' }
    });
  }

  // Replay A
  const stateA = await replayEvents(events);
  const hashA = computeStateHash(stateA);

  // Replay B
  const stateB = await replayEvents(events);
  const hashB = computeStateHash(stateB);

  console.log(`Replay A items: ${Object.keys(stateA).length}`);
  console.log(`Hash A: ${hashA}`);
  console.log(`Hash B: ${hashB}`);

  if (hashA === hashB && Object.keys(stateA).length === 500) {
    console.log("\nEvent Replay Determinism PASSED.");
  } else {
    console.log("\nEvent Replay Determinism FAILED.");
    process.exit(1);
  }
}

runTest();
