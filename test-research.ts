import { runResearchEngine } from './src/lib/research/research-engine';

async function test() {
  const t1 = await runResearchEngine("I want to build a ride-sharing application for students");
  console.log("T1:", t1.productCategory, t1.researchConfidence);

  const t2 = await runResearchEngine("Create a banking app with crypto features");
  console.log("T2:", t2.productCategory, t2.researchConfidence);

  const t3 = await runResearchEngine("Build a markdown note taking app");
  console.log("T3:", t3.productCategory, t3.researchConfidence);

  const t4 = await runResearchEngine("Fitness tracker for bodybuilders");
  console.log("T4:", t4.productCategory, t4.researchConfidence);
  
  const t5 = await runResearchEngine("AI powered legal marketplace");
  console.log("T5:", t5.productCategory, t5.researchConfidence);
}

test();
