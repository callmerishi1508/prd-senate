import { handleWebhookPayload } from './src/lib/integrations/webhooks/webhook-manager';
import { getAllEvents, clearEventStore } from './src/lib/integrations/events/event-store';

async function runTest() {
  console.log("=== Testing Webhooks & Event Sourcing ===");
  clearEventStore();
  const res = await handleWebhookPayload('GITHUB', { 'x-github-event': 'issues' }, { action: 'opened', issue: { title: 'Test' } });
  console.log(`Webhook Ingest Success: ${res.success}`);
  
  const events = getAllEvents();
  console.log(`Event Store Length: ${events.length}`);
  console.log(`First Event Type: ${events[0]?.type}`);
  console.log("Test Webhooks Complete.\n");
}
runTest();
