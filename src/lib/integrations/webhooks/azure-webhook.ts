import { IntegrationEvent } from '../events/event-schema';

export async function parseAzureWebhook(headers: any, body: any): Promise<IntegrationEvent | null> {
  const eventType = body.eventType;
  if (!eventType) return null;

  let type = 'unknown';
  if (eventType === 'workitem.created') type = 'issue.created';
  else if (eventType === 'workitem.updated') type = 'issue.updated';
  else if (eventType === 'workitem.deleted') type = 'issue.deleted';

  return {
    eventId: `evt-azure-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    provider: 'AZURE_DEVOPS',
    type,
    timestamp: new Date().toISOString(),
    payload: body
  };
}
