import { IntegrationEvent } from '../events/event-schema';

export async function parseJiraWebhook(headers: any, body: any): Promise<IntegrationEvent | null> {
  const eventName = body.webhookEvent;
  if (!eventName) return null;

  let type = 'unknown';
  if (eventName === 'jira:issue_created') type = 'issue.created';
  else if (eventName === 'jira:issue_updated') type = 'issue.updated';
  else if (eventName === 'jira:issue_deleted') type = 'issue.deleted';

  return {
    eventId: `evt-jira-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    provider: 'JIRA',
    type,
    timestamp: new Date().toISOString(),
    payload: body
  };
}
