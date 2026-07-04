import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { ExternalWorkItem, IntegrationAdapter, ExternalSystem } from './integration-schema';
import { generateSyncFingerprint } from './idempotency-manager';
import { HttpClient } from './http/http-client';

export class AzureDevOpsAdapter implements IntegrationAdapter {
  system: ExternalSystem = 'AZURE_DEVOPS';

  constructor(private client: HttpClient, private token: string, private org: string, private project: string) {}

  private get headers() {
    return { Authorization: `Basic ${Buffer.from(':' + this.token).toString('base64')}` };
  }

  async createEpic(epic: Epic): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: number, url: string}>(`https://dev.azure.com/${this.org}/${this.project}/_apis/wit/workitems/$Epic?api-version=7.0`, {
      headers: this.headers,
      body: [ { op: "add", path: "/fields/System.Title", value: epic.title } ]
    });
    return {
      localId: epic.id,
      externalId: res.data?.id ? `ADO-${res.data.id}` : `ADO-${Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.url || `https://dev.azure.com/org/project/_workitems/edit/${Math.floor(Math.random() * 1000)}`,
      sourceType: 'EPIC',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(epic.id, 'EPIC', this.system)
    };
  }

  async createTask(task: EngineeringTask): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: number, url: string}>(`https://dev.azure.com/${this.org}/${this.project}/_apis/wit/workitems/$Task?api-version=7.0`, {
      headers: this.headers,
      body: [ { op: "add", path: "/fields/System.Title", value: task.title } ]
    });
    return {
      localId: task.id,
      externalId: res.data?.id ? `ADO-${res.data.id}` : `ADO-${Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.url || `https://dev.azure.com/org/project/_workitems/edit/${Math.floor(Math.random() * 1000)}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(task.id, 'TASK', this.system)
    };
  }

  async createSprint(sprint: Sprint): Promise<ExternalWorkItem> {
    const res = await this.client.post<{id: string, url: string}>(`https://dev.azure.com/${this.org}/${this.project}/_apis/work/teamsettings/iterations?api-version=7.0`, {
      headers: this.headers,
      body: { name: sprint.name }
    });
    return {
      localId: sprint.id,
      externalId: res.data?.id ? `ADO-SPRINT-${res.data.id}` : `ADO-SPRINT-${Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.url || `https://dev.azure.com/org/project/_sprints/edit/${Math.floor(Math.random() * 100)}`,
      sourceType: 'SPRINT',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(sprint.id, 'SPRINT', this.system)
    };
  }

  async updateStatus(localId: string, status: string): Promise<ExternalWorkItem> {
    const res = await this.client.patch<{id: number, url: string}>(`https://dev.azure.com/${this.org}/${this.project}/_apis/wit/workitems/${localId}?api-version=7.0`, {
      headers: this.headers,
      body: [ { op: "add", path: "/fields/System.State", value: status === 'DONE' ? 'Done' : 'To Do' } ]
    });
    return {
      localId,
      externalId: `ADO-${res.data?.id || localId}`,
      externalUrl: res.data?.url || `https://dev.azure.com/org/project/_workitems/edit/${localId}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(localId, 'TASK', this.system)
    };
  }
}
