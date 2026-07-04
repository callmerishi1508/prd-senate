import { getCredential } from './auth/credential-store';

export function validateIntegrationSecurity(system: string) {
  const cred = getCredential(system);
  if (!cred) return { valid: false, reason: 'Missing credentials' };

  if (cred.expiresAt) {
    const expires = new Date(cred.expiresAt).getTime();
    if (expires < Date.now()) {
      return { valid: false, reason: 'Token expired' };
    }
  }

  return { valid: true };
}
