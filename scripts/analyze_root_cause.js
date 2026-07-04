const fs = require('fs');

function parseJSONL(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(l => l.trim().length > 0)
        .map(l => JSON.parse(l));
}

const generations = parseJSONL('c:/prd-senate/data/ai_generations.jsonl');
const corrections = parseJSONL('c:/prd-senate/data/ai_corrections.jsonl');

// 2. Exact pass/fail results for every model
const projectOutcomes = {};
// Since a project can have multiple generation attempts, a project is successful if its final generation is a success.
// Wait, the generations log has success: true/false for each STAGE.
// If ANY stage in a project failed and didn't recover, the project is a failure.
// In reality, the benchmark scripts just log the final result in the terminal, but let's see how many projects had a final success.
// Let's identify the last generation event for each project.
const lastGenPerProject = {};
generations.forEach(g => {
    if (!lastGenPerProject[g.projectId] || new Date(g.timestamp) > new Date(lastGenPerProject[g.projectId].timestamp)) {
        lastGenPerProject[g.projectId] = g;
    }
});

const modelStats = {};
Object.values(lastGenPerProject).forEach(g => {
    if (!modelStats[g.model]) modelStats[g.model] = { total: 0, passed: 0, failed: 0 };
    modelStats[g.model].total++;
    // If the last generation failed, the project failed.
    if (g.success) {
        modelStats[g.model].passed++;
    } else {
        modelStats[g.model].failed++;
    }
});

console.log("=== PASS/FAIL RESULTS BY MODEL ===");
console.log(JSON.stringify(modelStats, null, 2));

// 3. Top 20 correction events
const correctionCounts = {};
corrections.forEach(c => {
    correctionCounts[c.correctionType] = (correctionCounts[c.correctionType] || 0) + 1;
});
const sortedCorrections = Object.entries(correctionCounts).sort((a, b) => b[1] - a[1]);
console.log("\n=== TOP CORRECTION EVENTS ===");
console.log(JSON.stringify(sortedCorrections, null, 2));

// 5. Estimate success rates without corrections
// For each project, did it have any correction?
// Did it have a SCHEMA_REPAIR?
// Did it have a SOURCE_BACKFILL?
const projectCorrections = {};
corrections.forEach(c => {
    if (!projectCorrections[c.projectId]) {
        projectCorrections[c.projectId] = { any: false, schema: false, backfill: false };
    }
    projectCorrections[c.projectId].any = true;
    if (c.correctionType === 'SCHEMA_REPAIR') projectCorrections[c.projectId].schema = true;
    if (c.correctionType === 'SOURCE_BACKFILL') projectCorrections[c.projectId].backfill = true;
});

const totalProjects = Object.keys(lastGenPerProject).length;
let passedWithNoCorrections = 0;
let passedWithNoSchemaRepair = 0;
let passedWithNoBackfill = 0;
let passedTotal = 0;

Object.values(lastGenPerProject).forEach(g => {
    if (g.success) {
        passedTotal++;
        const pc = projectCorrections[g.projectId] || {};
        if (!pc.any) passedWithNoCorrections++;
        if (!pc.schema) passedWithNoSchemaRepair++;
        if (!pc.backfill) passedWithNoBackfill++;
    }
});

console.log("\n=== ESTIMATED SUCCESS RATES ===");
console.log(`Total Passed (current): ${passedTotal} / ${totalProjects} (${(passedTotal/totalProjects*100).toFixed(1)}%)`);
console.log(`Passed without ANY corrections: ${passedWithNoCorrections} / ${totalProjects} (${(passedWithNoCorrections/totalProjects*100).toFixed(1)}%)`);
console.log(`Passed without SCHEMA_REPAIR: ${passedWithNoSchemaRepair} / ${totalProjects} (${(passedWithNoSchemaRepair/totalProjects*100).toFixed(1)}%)`);
console.log(`Passed without SOURCE_BACKFILL: ${passedWithNoBackfill} / ${totalProjects} (${(passedWithNoBackfill/totalProjects*100).toFixed(1)}%)`);

// Let's also look at the 4 failures from the 50-project run
console.log("\n=== FAILED PROJECTS FROM 50-PROJECT RUN ===");
const failedStab = Object.values(lastGenPerProject).filter(g => g.projectId.startsWith('proj-stab') && !g.success);
console.log(failedStab.map(g => g.projectId));
