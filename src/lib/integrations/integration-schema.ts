import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';

export type ExternalSystem = 'GITHUB' | 'JIRA' | 'LINEAR' | 'AZURE_DEVOPS';

export type SyncState = 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface IntegrationConfig {
  id: string;
  system: ExternalSystem;
  baseUrl: string;
  projectKey: string;
  enabled: boolean;
}

export interface ExternalWorkItem {
  localId: string;
  externalId: string;
  externalUrl?: string;
  sourceType: 'EPIC' | 'TASK' | 'SPRINT' | 'REQUIREMENT';
  targetSystem: ExternalSystem;
  syncStatus: SyncState;
  lastSyncedAt: string;
  fingerprint: string;
}

export interface SyncResult {
  localId: string;
  sourceType: 'EPIC' | 'TASK' | 'SPRINT' | 'REQUIREMENT';
  status: SyncState;
  retryCount: number;
  lastError?: string;
  lastAttemptAt?: string;
}

export interface SyncJob {
  id: string;
  projectId: string;
  versionId: string;
  system: ExternalSystem;
  status: SyncState;
  createdAt: string;
  completedAt?: string;
  results: SyncResult[];
}

export interface IntegrationAdapter {
  system: ExternalSystem;
  createEpic(epic: Epic): Promise<ExternalWorkItem>;
  createTask(task: EngineeringTask): Promise<ExternalWorkItem>;
  createSprint(sprint: Sprint): Promise<ExternalWorkItem>;
  updateStatus(localId: string, status: string): Promise<ExternalWorkItem>;
}
