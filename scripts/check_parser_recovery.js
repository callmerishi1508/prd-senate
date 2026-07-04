const fs = require('fs');

try {
    const lines = fs.readFileSync('c:/prd-senate/data/ai_corrections.jsonl', 'utf-8').split('\n').filter(l => l.trim().length > 0);
    const counts = {
        'PARSER_RECOVERY_SUCCESS': 0,
        'PARSER_RECOVERY_FAILURE': 0,
        'PARSER_FALLBACK_TRIGGERED': 0
    };
    for (const line of lines) {
        const obj = JSON.parse(line);
        if (counts[obj.correctionType] !== undefined) {
            counts[obj.correctionType]++;
        }
    }
    console.log(counts);
} catch (e) {
    console.log("No data yet");
}
