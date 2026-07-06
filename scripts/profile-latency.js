const fs = require('fs');

const data = fs.readFileSync('C:\\prd-senate\\.next\\standalone\\data\\ai_generations.jsonl', 'utf-8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line))
  .filter(log => log.model === 'qwen2.5-coder:7b');

const stages = {};
let totalTime = 0;
const byProject = {};

data.forEach(log => {
  if (!stages[log.stage]) {
    stages[log.stage] = { count: 0, totalMs: 0 };
  }
  stages[log.stage].count++;
  stages[log.stage].totalMs += log.latencyMs;
  totalTime += log.latencyMs;
  
  if (!byProject[log.projectId]) {
      byProject[log.projectId] = { totalMs: 0, stages: {} };
  }
  byProject[log.projectId].totalMs += log.latencyMs;
  if (!byProject[log.projectId].stages[log.stage]) {
      byProject[log.projectId].stages[log.stage] = 0;
  }
  byProject[log.projectId].stages[log.stage] += log.latencyMs;
});

console.log("=== BY STAGE (Across all projects) ===");
for (const stage in stages) {
  const avg = stages[stage].totalMs / stages[stage].count;
  console.log(`${stage}: Count=${stages[stage].count}, AvgTime=${(avg / 1000).toFixed(1)}s, TotalTime=${(stages[stage].totalMs / 1000).toFixed(1)}s`);
}

console.log("\n=== BY PROJECT ===");
for (const p in byProject) {
    console.log(`Project ${p}: Total Time = ${(byProject[p].totalMs / 1000 / 60).toFixed(2)} mins`);
    for (const stage in byProject[p].stages) {
        console.log(`  - ${stage}: ${(byProject[p].stages[stage] / 1000 / 60).toFixed(2)} mins`);
    }
}
