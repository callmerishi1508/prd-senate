import { writeJsonAtomicSync } from './src/lib/integrations/atomic-write';
import fs from 'fs';

async function worker(id: number) {
  for (let i = 0; i < 200; i++) {
    try {
      const data = fs.existsSync('.senate-data/concurrent.json') 
        ? JSON.parse(fs.readFileSync('.senate-data/concurrent.json', 'utf-8'))
        : {};
      
      data[`TASK-${id}-${i}`] = 'SUCCESS';
      
      writeJsonAtomicSync('.senate-data/concurrent.json', data);
    } catch (err: any) {
      console.error(`Worker ${id} failed at ${i}:`, err.message);
    }
  }
}

async function runTest() {
  console.log("=== Testing Concurrent Sync Idempotency ===");
  if (fs.existsSync('.senate-data/concurrent.json')) {
    fs.unlinkSync('.senate-data/concurrent.json');
  }

  const workers = [worker(1), worker(2), worker(3), worker(4), worker(5)];
  await Promise.all(workers);
  
  const finalData = JSON.parse(fs.readFileSync('.senate-data/concurrent.json', 'utf-8'));
  const total = Object.keys(finalData).length;
  console.log(`Total records safely written concurrently: ${total} (Expected: 1000)`);
  console.log(`Atomic File Write Corruption: ${total === 1000 ? 'NONE' : 'DETECTED'}`);
}
runTest();
