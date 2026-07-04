import { IntegrationCredential } from './auth-schema';
import { saveCredential, getCredential, deleteCredential } from './credential-store';
import { refreshTokenIfNeeded } from './token-manager';

export async function getValidToken(system: string): Promise<string | null> {
  return refreshTokenIfNeeded(system);
}

export function storeCredential(cred: IntegrationCredential) {
  saveCredential(cred);
}

export function removeCredential(system: string) {
  deleteCredential(system);
}

export function getCredentialMeta(system: string) {
  const cred = getCredential(system);
  if (!cred) return null;
  return {
    system: cred.system,
    type: cred.type,
    hasToken: !!cred.token,
    expiresAt: cred.expiresAt
  };
}
