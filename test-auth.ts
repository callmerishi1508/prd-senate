import { encryptString, decryptString } from './src/lib/integrations/auth/credential-store';
import { connectViaPAT } from './src/lib/integrations/auth/auth-manager';
import { getValidToken } from './src/lib/integrations/auth/credential-manager';

async function runTest() {
  console.log("=== Testing Authentication Layer ===");
  const plain = "ghp_super_secret_token";
  const enc = encryptString(plain);
  const dec = decryptString(enc);
  console.log(`Encryption check: ${plain === dec ? 'PASS' : 'FAIL'}`);

  await connectViaPAT('GITHUB', plain);
  const token = await getValidToken('GITHUB');
  console.log(`PAT Retrieval: ${token === plain ? 'PASS' : 'FAIL'}`);
  console.log("Test Auth Complete.\n");
}
runTest();
