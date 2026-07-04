const fs = require('fs');

const corrections = fs.readFileSync('c:/prd-senate/data/ai_corrections.jsonl', 'utf-8')
    .split('\n').filter(l => l.trim().length > 0).map(l => JSON.parse(l));

const correctionCounts = {};
corrections.forEach(c => {
    correctionCounts[c.correctionType] = (correctionCounts[c.correctionType] || 0) + 1;
});
console.log("=== TOP CORRECTION EVENTS ===");
Object.entries(correctionCounts).sort((a,b)=>b[1]-a[1]).forEach(e => console.log(e[0] + ": " + e[1]));

const projectsWithSchemaRepair = new Set();
const projectsWithSourceBackfill = new Set();
const projectsWithAnyCorrection = new Set();

corrections.forEach(c => {
    projectsWithAnyCorrection.add(c.projectId);
    if (c.correctionType === 'SCHEMA_REPAIR') projectsWithSchemaRepair.add(c.projectId);
    if (c.correctionType === 'SOURCE_BACKFILL') projectsWithSourceBackfill.add(c.projectId);
});

console.log("\n=== ESTIMATES ===");
// There are 50 total projects in this run. 46 passed, 4 failed.
// Failed: proj-stab-23, proj-stab-30, proj-stab-44, proj-stab-49
const failedProjects = new Set(['proj-stab-23', 'proj-stab-30', 'proj-stab-44', 'proj-stab-49']);
const passedProjects = [];
for (let i = 0; i < 50; i++) {
    const p = `proj-stab-${i}`;
    if (!failedProjects.has(p)) passedProjects.push(p);
}

let passedNoCorrection = 0;
let passedNoSchemaRepair = 0;
let passedNoSourceBackfill = 0;

passedProjects.forEach(p => {
    if (!projectsWithAnyCorrection.has(p)) passedNoCorrection++;
    if (!projectsWithSchemaRepair.has(p)) passedNoSchemaRepair++;
    if (!projectsWithSourceBackfill.has(p)) passedNoSourceBackfill++;
});

console.log(`Passed total: ${passedProjects.length} / 50 (92%)`);
console.log(`Success rate without any corrections: ${passedNoCorrection} / 50 (${(passedNoCorrection/50*100).toFixed(1)}%)`);
console.log(`Success rate without SCHEMA_REPAIR: ${passedNoSchemaRepair} / 50 (${(passedNoSchemaRepair/50*100).toFixed(1)}%)`);
console.log(`Success rate without SOURCE_BACKFILL: ${passedNoSourceBackfill} / 50 (${(passedNoSourceBackfill/50*100).toFixed(1)}%)`);
