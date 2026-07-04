import { handleWebhookPayload } from './src/lib/integrations/webhooks/webhook-manager';
import { getAllEvents, clearEventStore } from './src/lib/integrations/events/event-store';
import { isSyncLooping } from './src/lib/integrations/sync-loop-protection';

async function generateStorm() {
  console.log("=== Testing Webhook Storm (10000 Events, 20% Dups, 10% Out-of-order) ===");
  clearEventStore();

  const eventsToFire: any[] = [];
  
  // 1. Generate 7000 unique events
  for (let i = 0; i < 7000; i++) {
    eventsToFire.push({
      id: `WS-${i}`,
      type: 'issue.updated',
      payload: { action: 'edited', issue: { id: `ISSUE-${i}`, title: `Title ${i}` } }
    });
  }

  // 2. Add 2000 duplicates
  for (let i = 0; i < 2000; i++) {
    eventsToFire.push({
      id: `WS-${i}`, // Duplicate of early events
      type: 'issue.updated',
      payload: { action: 'edited', issue: { id: `ISSUE-${i}`, title: `Title ${i}` } }
    });
  }

  // 3. Add 1000 out-of-order (older timestamp or weird order, but since we just push simultaneously, we just shuffle them)
  for (let i = 7000; i < 8000; i++) {
    eventsToFire.push({
      id: `WS-${i}`,
      type: 'issue.updated',
      payload: { action: 'edited', issue: { id: `ISSUE-${i}`, title: `Title ${i}` } }
    });
  }

  // Shuffle the 10,000 events to simulate network jitter
  eventsToFire.sort(() => Math.random() - 0.5);

  let duplicatesIgnored = 0;

  console.log("Dispatching 10,000 requests in chunks to avoid Node Event Loop starvation...");
  
  const chunkSize = 1000;
  for (let i = 0; i < eventsToFire.length; i += chunkSize) {
    const chunk = eventsToFire.slice(i, i + chunkSize);
    const promises = chunk.map(async (evt) => {
      const fingerprint = `WEBHOOK_${evt.id}`;
      if (isSyncLooping(fingerprint)) {
        duplicatesIgnored++;
        return;
      }
      await handleWebhookPayload('GITHUB', { 'x-github-event': 'issues' }, evt.payload);
    });
    await Promise.all(promises);
  }

  const savedEvents = getAllEvents();
  const lostEvents = 8000 - savedEvents.length; // We expect exactly 8000 unique successful writes

  console.log(`Events Fired: 10000`);
  console.log(`Events Saved: ${savedEvents.length} (Expected: 8000)`);
  console.log(`Duplicates Ignored: ${duplicatesIgnored} (Expected: 2000)`);
  console.log(`Lost Events: ${lostEvents}`);

  if (savedEvents.length === 8000 && lostEvents === 0) {
    console.log("\nWebhook Storm Test PASSED.");
  } else {
    console.log("\nWebhook Storm Test FAILED.");
    process.exit(1);
  }
}

generateStorm();
