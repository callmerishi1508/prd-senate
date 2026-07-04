import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { ExternalWorkItem, IntegrationAdapter, ExternalSystem } from './integration-schema';
import { generateSyncFingerprint } from './idempotency-manager';
import { HttpClient } from './http/http-client';

export class GithubAdapter implements IntegrationAdapter {
  system: ExternalSystem = 'GITHUB';
  
  constructor(private client: HttpClient, private token: string) {}

  private get headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async createEpic(epic: Epic): Promise<ExternalWorkItem> {
    const res = await this.client.post<{number: number, html_url: string}>('https://api.github.com/repos/org/repo/milestones', {
      headers: this.headers,
      body: { title: epic.title, description: epic.description }
    });

    return {
      localId: epic.id,
      externalId: `GH-MILESTONE-${res.data?.number || Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.html_url || `https://github.com/org/repo/milestone/${epic.id}`,
      sourceType: 'EPIC',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(epic.id, 'EPIC', this.system)
    };
  }

  async createTask(task: EngineeringTask): Promise<ExternalWorkItem> {
    const res = await this.client.post<{number: number, html_url: string}>('https://api.github.com/repos/org/repo/issues', {
      headers: this.headers,
      body: { title: task.title, body: task.description }
    });

    return {
      localId: task.id,
      externalId: `GH-ISSUE-${res.data?.number || Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.html_url || `https://github.com/org/repo/issues/${task.id}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(task.id, 'TASK', this.system)
    };
  }

  async createSprint(sprint: Sprint): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: number, html_url: string}>('https://api.github.com/orgs/org/projects', {
      headers: this.headers,
      body: { name: sprint.name, body: `Sprint Goals` }
    });

    return {
      localId: sprint.id,
      externalId: `GH-PROJECT-${res.data?.id || Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.html_url || `https://github.com/org/repo/projects/${sprint.id}`,
      sourceType: 'SPRINT',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(sprint.id, 'SPRINT', this.system)
    };
  }

  async updateStatus(localId: string, status: string): Promise<ExternalWorkItem> {
    const res = await this.client.patch<{number: number, html_url: string}>(`https://api.github.com/repos/org/repo/issues/${localId}`, {
      headers: this.headers,
      body: { state: status === 'DONE' ? 'closed' : 'open' }
    });
    return {
      localId,
      externalId: `GH-ISSUE-${res.data?.number || localId}`,
      externalUrl: res.data?.html_url,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(localId, 'TASK', this.system)
    };
  }
}
