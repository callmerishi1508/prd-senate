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

const statsByModel = {};

generations.forEach(g => {
    if (!statsByModel[g.model]) {
        statsByModel[g.model] = {
            totalProjects: new Set(),
            failedProjects: new Set(),
            corrections: [],
            criticalEscapes: 0
        };
    }
    statsByModel[g.model].totalProjects.add(g.projectId);
    if (!g.success) {
        statsByModel[g.model].failedProjects.add(g.projectId);
    }
});

corrections.forEach(c => {
    if (!statsByModel[c.model]) return;
    statsByModel[c.model].corrections.push(c);
});

console.log("=== METRICS BY MODEL ===");
for (const model in statsByModel) {
    const s = statsByModel[model];
    const total = s.totalProjects.size;
    const failed = s.failedProjects.size;
    const passed = total - failed;
    const passRate = (total === 0) ? 0 : (passed / total * 100).toFixed(1);
    
    // Average correction rate: total corrections / total stages generated. But let's just do corrections per project.
    const stages = generations.filter(g => g.model === model).length;
    const correctionRate = (stages === 0) ? 0 : (s.corrections.length / stages * 100).toFixed(1);
    
    // Retry rate
    const retries = s.corrections.filter(c => c.correctionType === 'CONSENSUS_RETRY' || c.correctionType === 'RESEARCH_RETRY').length;
    const retryRate = (stages === 0) ? 0 : (retries / stages * 100).toFixed(1);
    
    const escapes = s.criticalEscapes;

    const failureCategories = {};
    s.corrections.forEach(c => {
        failureCategories[c.correctionType] = (failureCategories[c.correctionType] || 0) + 1;
    });

    console.log(`Model: ${model}`);
    console.log(`Total Projects: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Correction Rate (per stage): ${correctionRate}%`);
    console.log(`Retry Rate (per stage): ${retryRate}%`);
    console.log(`Critical Escapes: ${escapes}`);
    console.log(`Failure Categories:`, failureCategories);
    console.log('---------------------------');
}

console.log("=== RAW EXAMPLES OF FAILED OUTPUTS ===");
// Since we don't have the raw outputs in the jsonls directly without parsing logs,
// we'll just check if any file in reports/ contains raw examples.
