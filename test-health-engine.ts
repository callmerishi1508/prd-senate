import { calculateProductHealth } from './src/lib/intelligence/health-engine';
import { PRDVersion } from './src/lib/versioning/version-schema';

async function run() {
  const mockPrd = {
    id: "v1", versionNumber: 1, title: "Test",
    structuredPRD: {
      productOverview: "Test",
      functionalRequirements: Array(60).fill({ description: 'Req', purpose: 'Test' })
    },
    versionHistory: []
  } as unknown as PRDVersion;
  
  const score = calculateProductHealth(mockPrd);
  console.log("Health Score:", score.score);
  console.log("Rating:", score.rating);
  if (score.score < 100) console.log("Test Passed");
  else process.exit(1);
}
run();
