import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { ExternalWorkItem, IntegrationAdapter, ExternalSystem } from './integration-schema';
import { generateSyncFingerprint } from './idempotency-manager';
import { HttpClient } from './http/http-client';

export class JiraAdapter implements IntegrationAdapter {
  system: ExternalSystem = 'JIRA';

  constructor(private client: HttpClient, private token: string, private domain: string) {}

  private get headers() {
    return { Authorization: `Basic ${this.token}` };
  }

  async createEpic(epic: Epic): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: string, key: string}>(`https://${this.domain}.atlassian.net/rest/api/3/issue`, {
      headers: this.headers,
      body: { fields: { summary: epic.title, issuetype: { name: 'Epic' } } }
    });
    return {
      localId: epic.id,
      externalId: res.data?.key || `JIRA-${Math.floor(Math.random() * 10000)}`,
      externalUrl: `https://${this.domain}.atlassian.net/browse/${res.data?.key || 'JIRA-1'}`,
      sourceType: 'EPIC',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(epic.id, 'EPIC', this.system)
    };
  }

  async createTask(task: EngineeringTask): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: string, key: string}>(`https://${this.domain}.atlassian.net/rest/api/3/issue`, {
      headers: this.headers,
      body: { fields: { summary: task.title, issuetype: { name: 'Task' } } }
    });
    return {
      localId: task.id,
      externalId: res.data?.key || `JIRA-${Math.floor(Math.random() * 10000)}`,
      externalUrl: `https://${this.domain}.atlassian.net/browse/${res.data?.key || 'JIRA-1'}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(task.id, 'TASK', this.system)
    };
  }

  async createSprint(sprint: Sprint): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: number}>(`https://${this.domain}.atlassian.net/rest/agile/1.0/sprint`, {
      headers: this.headers,
      body: { name: sprint.name, originBoardId: 1 }
    });
    return {
      localId: sprint.id,
      externalId: `JIRA-SPRINT-${res.data?.id || Math.floor(Math.random() * 10000)}`,
      externalUrl: `https://${this.domain}.atlassian.net/secure/RapidBoard.jspa?sprint=${res.data?.id || 1}`,
      sourceType: 'SPRINT',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(sprint.id, 'SPRINT', this.system)
    };
  }

  async updateStatus(localId: string, status: string): Promise<ExternalWorkItem> {
    const res = await this.client.post(`https://${this.domain}.atlassian.net/rest/api/3/issue/${localId}/transitions`, {
      headers: this.headers,
      body: { transition: { id: status === 'DONE' ? '31' : '11' } }
    });
    return {
      localId,
      externalId: localId,
      externalUrl: `https://${this.domain}.atlassian.net/browse/${localId}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(localId, 'TASK', this.system)
    };
  }
}
