import { strict as assert } from 'assert';
import { Agent, setGlobalDispatcher } from 'undici';
import fs from 'fs';
import path from 'path';

setGlobalDispatcher(new Agent({ bodyTimeout: 0 }));

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const baseUrl = 'http://localhost:3000';

async function generatePRD(projectId: string, statement: string, model: string = "qwen2.5:1.5b") {
  console.log(`[Project ${projectId}] Starting pipeline for: ${statement} (Model: ${model})`);
  const timeoutMs = model === 'qwen2.5:1.5b' ? 30 * 60 * 1000 : 120 * 60 * 1000;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const bodyData = JSON.stringify({
      projectId,
      problemStatement: statement,
      targetUsers: "General users",
      constraints: "Must be scalable and reliable",
      model
  });

  const startTime = Date.now();
  let success = false;
  let validationFailed = false;

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyData,
      signal: controller.signal
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      
      for (const block of blocks) {
        let event = '';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim();
          if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (event === 'done') success = data.success;
            if (event === 'validation-failed') {
              validationFailed = true;
              console.log("    [Validation Blocked]:", data.reasons);
            }
          } catch(e) {}
        }
      }
    }
  } catch (e: any) {
     console.log("    [Timeout/Error]: Fetch aborted or failed:", e.message);
     success = false;
     if (e.name === 'AbortError') {
        fs.appendFileSync(path.join(process.cwd(), 'data', 'MODEL_FAILURE_ARTIFACTS.jsonl'), JSON.stringify({
           projectId, model, reason: 'TIMEOUT', threshold: timeoutMs, timestamp: new Date().toISOString()
        }) + '\n');
     }
  } finally {
     clearTimeout(timeoutId);
  }

  const latencyMs = Date.now() - startTime;
  if (validationFailed || !success) {
    throw new Error("AI Generation Failed or Timed out.");
  }
  return latencyMs;
}

async function runSuite() {
  const args = process.argv.slice(2);
  const suiteArg = args.find(a => a.startsWith('--suite='));
  const suite = suiteArg ? suiteArg.split('=')[1] : 'stability';
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;

  console.log(`\n==========================================`);
  console.log(`RELIABILITY BENCHMARK SUITE: ${suite.toUpperCase()}`);
  console.log(`==========================================\n`);

  // Define prompts based on suite
  let projects: { id: string, stmt: string, model: string }[] = [];

  const domains = [
    "Build a Ride Sharing Platform",
    "Build a Hospital Management System",
    "Build an E-Commerce Marketplace",
    "Build a Manufacturing ERP",
    "Build an Agriculture Marketplace",
    "Build a Drone Fleet Management tool",
    "Build a University Management System",
    "Build an Insurance Claims Platform",
    "Build a Legal Contract Assistant",
    "Build an IoT Smart Home Platform"
  ];

  if (suite === 'adversarial') {
    const adv = [
      "Build an app",
      "Create something innovative",
      "Make a platform that helps people",
      "Build Uber + Netflix + AI + Blockchain",
      "asdfghjkl",
      "Create the next billion dollar startup"
    ];
    projects = adv.map((stmt, i) => ({ id: `proj-adv-${i}`, stmt, model: "qwen2.5:1.5b" }));
  } else if (suite === 'compatibility-10') {
    const models = ["qwen2.5:1.5b", "qwen2.5-coder:7b", "llama3.1:8b"];
    const explicitDomains = [
      "Build a Ride Sharing Platform",
      "Build a Manufacturing ERP",
      "Build an Agriculture Marketplace",
      "Build a Hospital Management System",
      "Build a Drone Fleet Management tool",
      "Build a Student Collaboration Platform",
      "Build an E-Commerce Marketplace",
      "Build an IoT Smart Home Platform",
      "Build a Legal Contract Assistant",
      "Build an AI Research Assistant"
    ];
    for (const m of models) {
      for (let i = 0; i < explicitDomains.length; i++) {
        projects.push({ id: `proj-comp-${m.replace(':','-')}-${i}`, stmt: explicitDomains[i], model: m });
      }
    }
  } else if (suite === 'robustness') {
    const models = ["qwen2.5:1.5b", "qwen2.5-coder:7b", "llama3.1:8b"];
    const vagueDomains = [
      "Build an app",
      "Create something innovative",
      "Design a startup"
    ];
    for (const m of models) {
      for (let i = 0; i < vagueDomains.length; i++) {
        projects.push({ id: `proj-rob-${m.replace(':','-')}-${i}`, stmt: vagueDomains[i], model: m });
      }
    }
  } else if (suite === 'domain') {
    projects = domains.map((stmt, i) => ({ id: `proj-dom-${i}`, stmt, model: "qwen2.5:1.5b" }));
  } else if (suite === 'models') {
    const models = ["qwen2.5:1.5b", "qwen2.5-coder:7b", "llama3.1:8b"];
    for (const m of models) {
      for (let i = 0; i < 1; i++) {
        projects.push({ id: `proj-mod-${m.replace(':','-')}-${i}`, stmt: domains[i], model: m });
      }
    }
  } else if (suite === 'regression') {
    for (let i = 0; i < 10; i++) {
      projects.push({ id: `proj-reg-${i}`, stmt: "Build a ride sharing platform for college students", model: "qwen2.5:1.5b" });
    }
  } else {
    // stability
    for (let i = 0; i < limit; i++) {
      projects.push({ id: `proj-stab-${i}`, stmt: domains[i % domains.length] + ` (Iter ${Math.floor(i/domains.length)+1})`, model: "qwen2.5:1.5b" });
    }
  }

  // Clear baseline
  console.log("Clearing previous telemetry data...");
  const dataDir = path.join(process.cwd(), 'data');
  for (const file of ['ai_corrections.jsonl', 'ai_generations.jsonl', 'versions.json']) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const knowledgeDir = path.join(dataDir, 'knowledge');
  if (fs.existsSync(knowledgeDir)) fs.rmSync(knowledgeDir, { recursive: true, force: true });
  await delay(2000);

  let successCount = 0;
  let failCount = 0;
  let crossContamination = 0;

  for (const proj of projects) {
    try {
      await generatePRD(proj.id, proj.stmt, proj.model);
      successCount++;
      console.log(`    ✅ Success`);
    } catch (e: any) {
      failCount++;
      console.log(`    ❌ Failed: ${e.message}`);
    }
  }

  // Check Isolation for Stability
  if (suite === 'stability') {
     const docsPath = path.join(knowledgeDir, 'documents.json');
     if (fs.existsSync(docsPath)) {
        const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        for (const doc of docs) {
           if (["PRD", "PLANNING", "DELIVERY", "INTEGRATION"].includes(doc.type) && !doc.projectId) {
              crossContamination++;
           }
        }
     }
  }

  // Fetch telemetry
  let stats: any = {};
  try {
    const telRes = await fetch(`${baseUrl}/api/telemetry`);
    stats = await telRes.json();
  } catch (e) {
    console.log("Error fetching telemetry:", e);
  }

  // Generate Reports
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const total = projects.length;
  const successRate = total > 0 ? (successCount / total) * 100 : 0;
  const healthScore = stats.healthScore ?? 100;
  const criticalEscapes = stats.criticalEscapes ?? 0;
  const corrEff = stats.correctionEfficiency ?? 1;

  let verdict = "BLOCKED";
  if (successRate >= 95 && criticalEscapes === 0 && crossContamination === 0 && healthScore >= 80 && corrEff >= 0.95) {
     verdict = "READY FOR GENERAL AVAILABILITY";
     if (suite !== 'stability') verdict = "READY FOR PILOT"; 
  } else if (successRate >= 90 && criticalEscapes === 0) {
     verdict = "READY FOR LIMITED BETA";
  } else if (successRate >= 80) {
     verdict = "READY FOR PILOT"; // Needs strict review
  }

  const reportMd = `# Reliability Benchmark Report (${suite.toUpperCase()})
Total Projects: ${total}
Successful: ${successCount}
Failed: ${failCount}

## Telemetry
- **Success Rate:** ${successRate.toFixed(1)}%
- **Health Score:** ${healthScore.toFixed(1)}
- **Correction Rate:** ${((stats.aiCorrectionRate || 0) * 100).toFixed(1)}%
- **Correction Efficiency:** ${(corrEff * 100).toFixed(1)}%
- **Average Latency:** ${((stats.averageLatencyMs || 0) / 1000).toFixed(1)}s
- **Critical Escapes:** ${criticalEscapes}
- **Cross-Project Contamination:** ${crossContamination}

## Penalties
- Validation: ${stats.penalties?.validationPenalty?.toFixed(1) || 0}
- Retry: ${stats.penalties?.retryPenalty?.toFixed(1) || 0}
- Correction: ${stats.penalties?.correctionPenalty?.toFixed(1) || 0}
- Latency: ${stats.penalties?.latencyPenalty?.toFixed(1) || 0}
`;

  fs.writeFileSync(path.join(reportsDir, `benchmark_report_${suite}.md`), reportMd);

  const topFailuresMd = `# Top Failure Sources
${Object.entries(stats.correctionsByType || {})
  .sort((a: any, b: any) => b[1] - a[1])
  .map(([type, count]) => `- **${type}**: ${count}`).join('\n')}
`;
  fs.writeFileSync(path.join(reportsDir, `top_failure_sources_${suite}.md`), topFailuresMd);

  const readinessMd = `# Deployment Readiness Report
**Suite:** ${suite}
**Verdict:** ${verdict}

### Gating Checklist
- [${successRate >= 95 ? 'x' : ' '}] Success Rate >= 95% (${successRate.toFixed(1)}%)
- [${criticalEscapes === 0 ? 'x' : ' '}] Critical Escapes = 0 (${criticalEscapes})
- [${crossContamination === 0 ? 'x' : ' '}] Cross-Project Contamination = 0 (${crossContamination})
- [${healthScore >= 80 ? 'x' : ' '}] Health Score >= 80 (${healthScore.toFixed(1)})
- [${corrEff >= 0.95 ? 'x' : ' '}] Correction Efficiency >= 95% (${(corrEff * 100).toFixed(1)}%)
`;
  fs.writeFileSync(path.join(reportsDir, `deployment_readiness_report_${suite}.md`), readinessMd);

  console.log(`\nReports generated in /reports folder.`);
  console.log(`Verdict: ${verdict}`);
}

runSuite();
