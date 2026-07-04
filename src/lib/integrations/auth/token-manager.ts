import { IntegrationCredential } from './auth-schema';
import { saveCredential, getCredential } from './credential-store';

export async function refreshTokenIfNeeded(system: string): Promise<string | null> {
  const cred = getCredential(system);
  if (!cred) return null;

  if (cred.type === 'PAT' || !cred.expiresAt) {
    return cred.token; // PATs don't auto-refresh here, or assume never expire
  }

  const expirationDate = new Date(cred.expiresAt);
  const now = new Date();

  // If expiring in less than 5 minutes, refresh
  if (expirationDate.getTime() - now.getTime() < 5 * 60 * 1000) {
    // Perform refresh
    const newTokens = await performOAuthRefresh(system, cred.refreshToken!);
    if (newTokens) {
      cred.token = newTokens.token;
      cred.refreshToken = newTokens.refreshToken;
      cred.expiresAt = newTokens.expiresAt;
      saveCredential(cred);
      return cred.token;
    } else {
      return null;
    }
  }

  return cred.token;
}

// Mock oauth refresh
async function performOAuthRefresh(system: string, refreshToken: string) {
  // In a real implementation, call GitHub/Jira OAuth endpoint here
  return {
    token: `REFRESHED_TOKEN_${Date.now()}`,
    refreshToken: `NEW_REFRESH_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
  };
}
