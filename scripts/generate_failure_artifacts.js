const fs = require('fs');

async function main() {
    try {
        const fileContent = fs.readFileSync('c:/prd-senate/data/forensic_raw_outputs.jsonl', 'utf-8');
        
        // Remove literal \n that might have been appended by the bug
        const cleanContent = fileContent.replace(/\\n\n/g, '\n').replace(/\\n$/g, '');
        const lines = cleanContent.split('\n').filter(l => l.trim().length > 0);
        
        let md = `# Forensic Failure Artifacts (Task 0)\n\n`;
        md += `This document captures the exact raw LLM outputs immediately prior to parsing failure, establishing a baseline for parser hardening.\n\n`;

        const classified = {
            'Trailing Comma': 0,
            'Markdown Wrapper': 0,
            'Truncated Output': 0,
            'Invalid Escaping': 0,
            'Multiple JSON Objects': 0,
            'Structural Schema Drift': 0,
            'Semantic Failure': 0,
            'Other': 0
        };

        let i = 1;
        for (let idx = 0; idx < lines.length; idx++) {
            let entry;
            let line = lines[idx].trim();
            if (line.endsWith('\\n')) {
                line = line.substring(0, line.length - 2);
            }

            try {
                entry = JSON.parse(line);
            } catch (e) {
                console.warn(`Line ${idx} is malformed: ${e.message}`);
                continue;
            }
            
            // Classification Logic
            let classification = 'Other';
            
            // Check if it's a semantic failure (parsed successfully)
            if (entry.parsingException === 'None' || !entry.parsingException) {
                classification = 'Semantic Failure'; 
            }
            // Check for markdown wrappers that STILL failed
            else if (entry.rawOutput.includes('```json') || entry.rawOutput.startsWith('```')) {
                if (entry.parsingException.includes('Unexpected token')) classification = 'Trailing Comma'; // Usually a comma inside the block
                else classification = 'Markdown Wrapper';
            } 
            // Check for actual parsing syntax errors
            else if (entry.parsingException.includes('Unexpected token ]') || entry.parsingException.includes('Unexpected token }') || entry.parsingException.includes("Expected ',' or ']'")) {
                classification = 'Trailing Comma';
            } else if (entry.parsingException.includes('Unexpected token')) {
                classification = 'Invalid Escaping';
            } else if (entry.parsingException.includes('Unexpected end of JSON') || entry.parsingException.includes('Unterminated string')) {
                classification = 'Truncated Output';
            }

            classified[classification]++;

            const first500 = entry.rawOutput.substring(0, 500);
            const last500 = entry.rawOutput.length > 500 ? entry.rawOutput.substring(entry.rawOutput.length - 500) : '';

            md += `## Artifact ${i} - ${entry.projectId} (${entry.model})\n`;
            md += `- **Stage:** ${entry.stage}\n`;
            md += `- **Timestamp:** ${entry.timestamp}\n`;
            md += `- **Output Length:** ${entry.length} chars (~${Math.round(entry.length / 4)} tokens)\n`;
            md += `- **Parsing Exception:** \`${entry.parsingException}\`\n`;
            md += `- **Classification:** **${classification}**\n\n`;
            
            md += `### First 500 Characters\n\`\`\`\n${first500}\n\`\`\`\n\n`;
            if (last500) {
                md += `### Last 500 Characters\n\`\`\`\n${last500}\n\`\`\`\n\n`;
            }
            md += `---\n\n`;
            i++;
        }

        md = `# Forensic Classification Summary\n\n` + 
             Object.entries(classified).map(([k, v]) => `- **${k}:** ${v}`).join('\n') + 
             `\n\n---\n\n` + md;

        fs.writeFileSync('c:/prd-senate/reports/failure_artifacts.md', md);
        console.log(`Successfully generated failure_artifacts.md with ${i-1} artifacts.`);
    } catch (e) {
        console.error('Failed to generate artifacts: ' + e.message);
    }
}

main();
