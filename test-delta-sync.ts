import { computeDelta } from './src/lib/integrations/delta-sync-engine';

function runTest() {
  console.log("=== Testing Delta Sync ===");
  const local = { id: 'T-1', title: 'Test', status: 'DONE', lastSyncedAt: 'now' };
  const remote = { id: 'T-1', title: 'Test', status: 'TODO', lastSyncedAt: 'before' };
  
  const diff = computeDelta(local, remote);
  console.log(`Diff keys length: ${Object.keys(diff).length}`);
  console.log(`Diff keys: ${Object.keys(diff).join(', ')}`);
  console.log(`Diff status: ${diff.status === 'DONE' ? 'PASS' : 'FAIL'}`);
  console.log("Test Delta Sync Complete.\n");
}
runTest();
