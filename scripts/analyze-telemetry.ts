import fs from 'fs/promises';

async function main() {
    const content = await fs.readFile('data/consensus_telemetry.json', 'utf-8');
    const logs = JSON.parse(content);

    const modes = ['legacy', 'hierarchical'];
    for (const mode of modes) {
        const modeLogs = logs.filter((l: any) => l.mode === mode);
        if (modeLogs.length === 0) continue;

        console.log(`\n=== TELEMETRY FOR MODE: ${mode} ===`);
        
        let totalLatency = 0;
        let totalPrompts = 0;
        let totalPromptChars = 0;
        let totalViolations = 0;
        let totalFailures = 0;

        // Group by stage to count average sizes
        const stageMap: Record<string, any> = {};

        modeLogs.forEach((l: any) => {
            totalLatency += l.latencyMs;
            totalPrompts++;
            totalPromptChars += l.promptChars;
            totalViolations += l.violations.length;
            if (!l.success) totalFailures++;

            if (!stageMap[l.stage]) {
                stageMap[l.stage] = { count: 0, chars: 0, latency: 0, failures: 0 };
            }
            stageMap[l.stage].count++;
            stageMap[l.stage].chars += l.promptChars;
            stageMap[l.stage].latency += l.latencyMs;
            if (!l.success) stageMap[l.stage].failures++;
        });

        console.log(`Average Latency (Overall): ${(totalLatency / totalPrompts / 1000).toFixed(2)}s per step`);
        console.log(`Average Prompt Size: ${(totalPromptChars / totalPrompts).toFixed(0)} chars`);
        console.log(`Schema Violation Rate: ${(totalViolations / totalPrompts).toFixed(2)} violations per step`);
        console.log(`Overall Success Rate: ${(((totalPrompts - totalFailures) / totalPrompts) * 100).toFixed(1)}%`);

        console.log(`\nBreakdown by Stage:`);
        for (const [stage, stats] of Object.entries(stageMap)) {
            const avgChars = (stats.chars / stats.count).toFixed(0);
            const avgLat = (stats.latency / stats.count / 1000).toFixed(2);
            const sucRate = (((stats.count - stats.failures) / stats.count) * 100).toFixed(1);
            console.log(`  - ${stage}: ${avgChars} chars, ${avgLat}s, ${sucRate}% success (${stats.count} runs)`);
        }
    }
}

main().catch(console.error);
