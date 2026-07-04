import { IntegrationEvent } from '../events/event-schema';
import { appendEvent } from '../events/event-store';
import { parseGithubWebhook } from './github-webhook';
import { parseJiraWebhook } from './jira-webhook';
import { parseLinearWebhook } from './linear-webhook';
import { parseAzureWebhook } from './azure-webhook';

export async function handleWebhookPayload(provider: string, headers: any, rawBody: any): Promise<{success: boolean, eventId?: string}> {
  let event: IntegrationEvent | null = null;
  
  switch (provider.toUpperCase()) {
    case 'GITHUB':
      event = await parseGithubWebhook(headers, rawBody);
      break;
    case 'JIRA':
      event = await parseJiraWebhook(headers, rawBody);
      break;
    case 'LINEAR':
      event = await parseLinearWebhook(headers, rawBody);
      break;
    case 'AZURE_DEVOPS':
      event = await parseAzureWebhook(headers, rawBody);
      break;
  }

  if (event) {
    appendEvent(event);
    return { success: true, eventId: event.eventId };
  }

  return { success: false };
}
