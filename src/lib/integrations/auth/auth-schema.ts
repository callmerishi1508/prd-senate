export type AuthType = 'PAT' | 'OAUTH';

export interface IntegrationCredential {
  system: string; // e.g. GITHUB, JIRA
  type: AuthType;
  token: string;
  refreshToken?: string;
  expiresAt?: string; // ISO date if oauth
  domain?: string; // e.g. Jira domain
  org?: string; // e.g. Azure org
  project?: string; // e.g. Azure project
}
