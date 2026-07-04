import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { rotateMasterKey, saveCredential, getCredential } from './src/lib/integrations/auth/credential-store';

function runTest() {
  console.log("=== Testing Secret Rotation ===");

  // Write an initial credential
  saveCredential({
    system: 'TEST_SYSTEM',
    type: 'PAT',
    token: 'super-secret-original-token'
  });

  const originalCred = getCredential('TEST_SYSTEM');
  console.log(`Original token decrypted correctly: ${originalCred?.token === 'super-secret-original-token'}`);

  // Rotate Key
  const newKey = crypto.randomBytes(32);
  rotateMasterKey(newKey);

  // Validate we can still read the credential correctly
  const rotatedCred = getCredential('TEST_SYSTEM');
  console.log(`Rotated token decrypted correctly: ${rotatedCred?.token === 'super-secret-original-token'}`);

  if (rotatedCred?.token === 'super-secret-original-token') {
    console.log("\nSecret Rotation Test PASSED.");
  } else {
    console.log("\nSecret Rotation Test FAILED.");
    process.exit(1);
  }
}

runTest();
