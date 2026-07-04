import { IntegrationEvent } from '../events/event-schema';

export async function parseLinearWebhook(headers: any, body: any): Promise<IntegrationEvent | null> {
  const action = body.action; // create, update, remove
  const typeStr = body.type;  // Issue, Project, Cycle
  if (!action || !typeStr) return null;

  let type = 'unknown';
  if (typeStr === 'Issue') {
    if (action === 'create') type = 'issue.created';
    else if (action === 'update') type = 'issue.updated';
    else if (action === 'remove') type = 'issue.deleted';
  }

  return {
    eventId: `evt-linear-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    provider: 'LINEAR',
    type,
    timestamp: new Date().toISOString(),
    payload: body
  };
}
