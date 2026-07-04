const fs = require('fs');
const corrections = fs.readFileSync('c:/prd-senate/data/ai_corrections.jsonl', 'utf-8')
    .split('\n').filter(l => l.trim().length > 0).map(l => JSON.parse(l));

const schemaRepairs = corrections.filter(c => c.correctionType === 'SCHEMA_REPAIR' && c.details);

let missingFieldsCount = 0;
let otherRepairs = 0;

schemaRepairs.forEach(c => {
    if (c.details.includes('Actual: undefined')) {
        missingFieldsCount++;
    } else {
        otherRepairs++;
        console.log(`[OTHER] ${c.details}`);
    }
});

console.log(`Missing Fields: ${missingFieldsCount}`);
console.log(`Other Repairs: ${otherRepairs}`);

// Let's also check VALIDATION_FAILURE
const validationFailures = corrections.filter(c => c.correctionType === 'VALIDATION_FAILURE' && c.details);
let missingCriticalCount = 0;
let otherCritical = 0;
validationFailures.forEach(c => {
    if (c.details.includes('Actual: undefined')) {
        missingCriticalCount++;
    } else {
        otherCritical++;
    }
});

console.log(`Critical Missing Fields: ${missingCriticalCount}`);
console.log(`Other Critical: ${otherCritical}`);
