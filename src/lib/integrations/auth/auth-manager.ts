import { IntegrationCredential, AuthType } from './auth-schema';
import { storeCredential } from './credential-manager';

export async function connectViaPAT(system: string, token: string, options?: { domain?: string, org?: string, project?: string }) {
  const cred: IntegrationCredential = {
    system,
    type: 'PAT',
    token,
    domain: options?.domain,
    org: options?.org,
    project: options?.project
  };
  storeCredential(cred);
  return { success: true };
}

export async function connectViaOAuth(system: string, code: string) {
  // Mock OAuth exchange
  const cred: IntegrationCredential = {
    system,
    type: 'OAUTH',
    token: `OAUTH_TOKEN_${Date.now()}`,
    refreshToken: `OAUTH_REFRESH_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
  };
  storeCredential(cred);
  return { success: true };
}
