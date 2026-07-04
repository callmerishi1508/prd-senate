import { runResearchEngine } from './src/lib/research/research-engine';
import { runQualityGate } from './src/lib/quality/quality-gate';
import { renderPRDToMarkdown } from './src/lib/prd/renderer';

async function testEngine() {
  console.log("=== Running Research Engine Tests ===");

  const t1 = await runResearchEngine("Build a ride sharing app");
  console.log("Test 1 (Ride Sharing):", t1.productCategory, "- Confidence:", t1.researchConfidence);
  console.log("  Top Scores:", JSON.stringify(t1.categoryScores));

  const t2 = await runResearchEngine("Build a banking app");
  console.log("Test 2 (Banking):", t2.productCategory, "- Confidence:", t2.researchConfidence);
  console.log("  Top Scores:", JSON.stringify(t2.categoryScores));

  const t3 = await runResearchEngine("Build an AI legal marketplace");
  console.log("Test 3 (AI Legal Marketplace):", t3.productCategory, "- Confidence:", t3.researchConfidence);
  console.log("  Top Scores:", JSON.stringify(t3.categoryScores));

  const t4 = await runResearchEngine("Build an AI recruiting platform");
  console.log("Test 4 (AI Recruiting Platform):", t4.productCategory, "- Confidence:", t4.researchConfidence);
  console.log("  Top Scores:", JSON.stringify(t4.categoryScores));
  
  const t5 = await runResearchEngine("Build a consciousness engineering platform");
  console.log("Test 5 (Consciousness Engineering Platform):", t5.productCategory, "- Confidence:", t5.researchConfidence);
  console.log("  Top Scores:", JSON.stringify(t5.categoryScores));
}

async function testQualityGate() {
  console.log("\n=== Running Quality Gate Completeness Test ===");
  
  // We'll simulate a PRD for Ride Sharing but omit "Location/GPS tracking" 
  const mockPRD = {
    productOverview: "A ride sharing application for users.",
    goals: [{ description: "Match riders and drivers" }],
    nonGoals: [{ description: "Food delivery" }],
    userPersonas: [
      { name: "Rider", age: "25", gender: "Any", healthStatus: "Good", preferences: "Fast rides" }
    ],
    functionalRequirements: [
      { id: "FR-01", description: "Users can pay for rides", purpose: "Payments", userValue: "Convenience", source: "Market Standard" },
      { id: "FR-02", description: "Users can rate drivers", purpose: "Ratings", userValue: "Trust", source: "Market Standard" }
      // INTENTIONALLY OMITTING GPS / LOCATION TRACKING
    ],
    userExperience: "Clean and simple.",
    narrative: "User opens app, gets ride.",
    successMetrics: [{ id: "SM-01", description: "Rides completed" }],
    technicalConsiderations: ["Data storage", "Security", "Privacy", "Performance", "Scalability"],
    milestones: ["MVP", "V2"],
    userStories: [
      { id: "US-01", title: "Pay for ride", description: "As a rider I want to pay.", acceptanceCriteria: ["Payment successful"] }
    ]
  };

  const md = renderPRDToMarkdown(mockPRD as any);
  
  console.log("Invoking Quality Gate (expecting it to notice missing GPS/Location standard for a ride sharing app)...");
  
  // Actually we need the context of the product category for Quality Gate. 
  // Wait, does Quality Gate know the category? Our prompt says "Ensure the PRD contains functional requirements that cover the market standards defined for the detected product category."
  // But wait! We pass the markdown PRD to Quality Gate. We never passed the Research Report to Quality Gate!
  const rideSharingReport = await runResearchEngine("Build a ride sharing app");
  const report = await runQualityGate(md, rideSharingReport as any, 'qwen2.5:1.5b') as any;
  console.log("Quality Gate Decision:", report.decision);
  if (report.criticalIssues?.length) console.log("Critical Issues:", report.criticalIssues);
  if (report.majorIssues?.length) console.log("Major Issues:", report.majorIssues);
  if (report.minorIssues?.length) console.log("Minor Issues:", report.minorIssues);
}

async function main() {
  await testEngine();
}

main().catch(console.error);
