import crypto from 'crypto';
import { IntegrationEvent } from '../events/event-schema';

export async function parseGithubWebhook(headers: any, body: any): Promise<IntegrationEvent | null> {
  // Extract event type
  const githubEvent = headers['x-github-event'];
  if (!githubEvent) return null;

  // Real implementation would verify the signature using crypto 
  // const signature = headers['x-hub-signature-256'];

  let type = 'unknown';
  if (githubEvent === 'issues') {
    if (body.action === 'opened') type = 'issue.created';
    else if (body.action === 'edited') type = 'issue.updated';
    else if (body.action === 'closed') type = 'issue.closed';
  } else if (githubEvent === 'projects_v2_item') {
    type = 'sprint.updated';
  }

  return {
    eventId: `evt-github-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    provider: 'GITHUB',
    type,
    timestamp: new Date().toISOString(),
    payload: body
  };
}
