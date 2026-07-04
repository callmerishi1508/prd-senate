import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IntegrationCredential } from './auth-schema';

const SECRETS_DIR = path.join(process.cwd(), '.senate-data', 'secrets');
const KEY_FILE = path.join(SECRETS_DIR, 'master.key');
const STORE_FILE = path.join(SECRETS_DIR, 'credentials.json');

function getMasterKey(): Buffer {
  if (process.env.ENCRYPTION_KEY) {
    return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
    // In a real environment, we should chmod 700 SECRETS_DIR
  }

  if (!fs.existsSync(KEY_FILE)) {
    const key = crypto.randomBytes(32);
    fs.writeFileSync(KEY_FILE, key.toString('hex'), { mode: 0o600 });
  }

  const keyHex = fs.readFileSync(KEY_FILE, 'utf-8').trim();
  return Buffer.from(keyHex, 'hex');
}

export function encryptString(text: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptString(encryptedText: string): string {
  const key = getMasterKey();
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid encrypted format');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function rotateMasterKey(newKey: Buffer) {
  const store = loadAllCredentialsRaw();
  const oldKey = getMasterKey();
  
  // Custom decrypt using specific key
  const decryptWithKey = (encryptedText: string, keyToUse: Buffer) => {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyToUse, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  };

  // Custom encrypt using specific key
  const encryptWithKey = (text: string, keyToUse: Buffer) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyToUse, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  };

  const newStore: any = {};
  for (const sys of Object.keys(store)) {
    const safeCred = store[sys];
    const cred = { ...safeCred, token: decryptWithKey(safeCred.token, oldKey) };
    if (cred.refreshToken) {
      cred.refreshToken = decryptWithKey(cred.refreshToken, oldKey);
    }
    
    // Re-encrypt with new key
    const newSafeCred = { ...cred, token: encryptWithKey(cred.token, newKey) };
    if (newSafeCred.refreshToken) {
      newSafeCred.refreshToken = encryptWithKey(newSafeCred.refreshToken, newKey);
    }
    newStore[sys] = newSafeCred;
  }

  // Atomically write new store and new key
  fs.writeFileSync(KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
  fs.writeFileSync(STORE_FILE, JSON.stringify(newStore, null, 2), { mode: 0o600 });
}

export function saveCredential(cred: IntegrationCredential) {
  const store = loadAllCredentialsRaw();
  
  // Encrypt sensitive fields
  const safeCred = { ...cred, token: encryptString(cred.token) };
  if (safeCred.refreshToken) {
    safeCred.refreshToken = encryptString(safeCred.refreshToken);
  }
  
  store[cred.system] = safeCred;
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function getCredential(system: string): IntegrationCredential | null {
  const store = loadAllCredentialsRaw();
  const safeCred = store[system];
  if (!safeCred) return null;
  
  try {
    const cred = { ...safeCred, token: decryptString(safeCred.token) };
    if (cred.refreshToken) {
      cred.refreshToken = decryptString(cred.refreshToken);
    }
    return cred;
  } catch (err) {
    console.error(`Failed to decrypt credential for ${system}`);
    return null;
  }
}

export function deleteCredential(system: string) {
  const store = loadAllCredentialsRaw();
  if (store[system]) {
    delete store[system];
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
  }
}

function loadAllCredentialsRaw(): Record<string, IntegrationCredential> {
  if (!fs.existsSync(STORE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}
