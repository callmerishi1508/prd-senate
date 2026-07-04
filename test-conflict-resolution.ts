import { registerConflict, resolveConflict, getAllConflicts } from './src/lib/integrations/conflict-resolution';

function runTest() {
  console.log("=== Testing Conflict Resolution ===");
  const conflict = registerConflict('T-1', 'GH-1', 'GITHUB', { title: 'Local' }, { title: 'Remote' });
  console.log(`Conflict Registered: ${conflict.id}`);
  
  resolveConflict(conflict.id, 'LOCAL');
  
  const conflicts = getAllConflicts();
  const c = conflicts.find(x => x.id === conflict.id);
  console.log(`Conflict Resolved Status: ${c?.resolved}`);
  console.log(`Conflict Resolution: ${c?.resolution}`);
  console.log("Test Conflicts Complete.\n");
}
runTest();
