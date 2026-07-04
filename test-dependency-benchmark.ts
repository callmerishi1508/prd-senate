import { detectDependencies } from './src/lib/planning/dependency-engine';
import { Epic } from './src/lib/planning/planning-schema';
import fs from 'fs';
import path from 'path';

const domains = ["Auth", "Profile", "Payment", "Settings", "Analytics", "Dashboard", "Routing", "Storage"];

async function generateEpics(count: number): Promise<Epic[]> {
  return Array.from({ length: count }).map((_, i) => {
    const d1 = domains[i % domains.length];
    const d2 = domains[(i + 1) % domains.length];
    return {
      id: `EPIC-${i}`,
      title: `${d1} Module for ${d2} Domain`,
      description: `Implement the ${d1} module. Sometimes explicitly requires EPIC-${(i+1)%count}.`,
      priority: "MEDIUM",
      estimatedEffort: "M",
      estimatedWeeks: 2,
      relatedRequirements: [`REQ-${i % 10}`], // Reduced overlap
      relatedStories: []
    };
  });
}

async function runBenchmark() {
  console.log("=== Dependency Engine Benchmark ===");

  const sizes = [10, 20, 30, 50, 100];
  
  for (const size of sizes) {
    // Wipe cache to ensure a fresh cold-cache test per iteration
    try {
      const CHUNKS_FILE = path.join(process.cwd(), 'data', 'knowledge', 'chunks.json');
      if (fs.existsSync(CHUNKS_FILE)) fs.unlinkSync(CHUNKS_FILE);
    } catch(e){}

    const epics = await generateEpics(size);
    
    const start = Date.now();
    await detectDependencies(epics, 'MOCK');
    const end = Date.now();
    
    console.log(`${size} Epics: ${(end - start)/1000} sec`);
  }
}

runBenchmark().catch(console.error);
