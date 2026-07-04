const fs = require('fs');

const corrections = fs.readFileSync('c:/prd-senate/data/ai_corrections.jsonl', 'utf-8')
    .split('\n').filter(l => l.trim().length > 0).map(l => JSON.parse(l));

const schemaRepairs = corrections.filter(c => c.correctionType === 'SCHEMA_REPAIR' && c.details);

// Shuffle and pick 100
for (let i = schemaRepairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [schemaRepairs[i], schemaRepairs[j]] = [schemaRepairs[j], schemaRepairs[i]];
}

const sample = schemaRepairs.slice(0, 100);

sample.forEach((c, i) => {
    console.log(`[Sample ${i + 1}] Details: ${c.details}`);
});
