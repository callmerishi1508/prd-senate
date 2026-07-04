export interface IntegrationEvent {
  eventId: string;
  provider: string; // 'GITHUB', 'JIRA', 'LINEAR', 'AZURE_DEVOPS', 'SYSTEM'
  type: string;     // 'issue.updated', 'issue.created', 'sprint.started', 'sync.push'
  timestamp: string;
  payload: any;
}
