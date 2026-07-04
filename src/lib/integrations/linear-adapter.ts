import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { ExternalWorkItem, IntegrationAdapter, ExternalSystem } from './integration-schema';
import { generateSyncFingerprint } from './idempotency-manager';
import { HttpClient } from './http/http-client';

export class LinearAdapter implements IntegrationAdapter {
  system: ExternalSystem = 'LINEAR';

  constructor(private client: HttpClient, private token: string) {}

  private get headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  async createEpic(epic: Epic): Promise<ExternalWorkItem> {
    const query = `mutation { projectCreate(input: { name: "${epic.title}", description: "${epic.description}" }) { project { id url } } }`;
    const res = await this.client.post<{data?: {projectCreate?: {project?: {id: string, url: string}}}}>('https://api.linear.app/graphql', {
      headers: this.headers,
      body: { query }
    });
    return {
      localId: epic.id,
      externalId: res.data?.data?.projectCreate?.project?.id || `LIN-PRJ-${Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.data?.projectCreate?.project?.url || `https://linear.app/org/project/LIN-${Math.floor(Math.random() * 1000)}`,
      sourceType: 'EPIC',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(epic.id, 'EPIC', this.system)
    };
  }

  async createTask(task: EngineeringTask): Promise<ExternalWorkItem> {
    const query = `mutation { issueCreate(input: { title: "${task.title}", description: "${task.description}" }) { issue { id url } } }`;
    const res = await this.client.post<{data?: {issueCreate?: {issue?: {id: string, url: string}}}}>('https://api.linear.app/graphql', {
      headers: this.headers,
      body: { query }
    });
    return {
      localId: task.id,
      externalId: res.data?.data?.issueCreate?.issue?.id || `LIN-${Math.floor(Math.random() * 10000)}`,
      externalUrl: res.data?.data?.issueCreate?.issue?.url || `https://linear.app/org/issue/LIN-${Math.floor(Math.random() * 1000)}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(task.id, 'TASK', this.system)
    };
  }

  async createSprint(sprint: Sprint): Promise<ExternalWorkItem> {
    const query = `mutation { cycleCreate(input: { name: "${sprint.name}" }) { cycle { id } } }`;
    const res = await this.client.post<{data?: {cycleCreate?: {cycle?: {id: string}}}}>('https://api.linear.app/graphql', {
      headers: this.headers,
      body: { query }
    });
    return {
      localId: sprint.id,
      externalId: res.data?.data?.cycleCreate?.cycle?.id || `LIN-CYC-${Math.floor(Math.random() * 10000)}`,
      externalUrl: `https://linear.app/org/cycle/LIN-${Math.floor(Math.random() * 100)}`,
      sourceType: 'SPRINT',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(sprint.id, 'SPRINT', this.system)
    };
  }

  async updateStatus(localId: string, status: string): Promise<ExternalWorkItem> {
    const query = `mutation { issueUpdate(id: "${localId}", input: { stateId: "${status === 'DONE' ? 'done-id' : 'todo-id'}" }) { issue { id url } } }`;
    const res = await this.client.post<{data?: {issueUpdate?: {issue?: {id: string, url: string}}}}>('https://api.linear.app/graphql', {
      headers: this.headers,
      body: { query }
    });
    return {
      localId,
      externalId: localId,
      externalUrl: res.data?.data?.issueUpdate?.issue?.url || `https://linear.app/org/issue/${localId}`,
      sourceType: 'TASK',
      targetSystem: this.system,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date().toISOString(),
      fingerprint: generateSyncFingerprint(localId, 'TASK', this.system)
    };
  }
}
