import { isSyncLooping } from './src/lib/integrations/sync-loop-protection';

function runTest() {
  console.log("=== Testing Sync Loop Protection ===");
  const fp = "GITHUB_TASK_T-1";
  const r1 = isSyncLooping(fp); // False
  const r2 = isSyncLooping(fp); // True
  console.log(`First attempt looping: ${r1}`);
  console.log(`Second attempt looping (under 2s): ${r2}`);
  console.log("Test Sync Loop Complete.\n");
}
runTest();
