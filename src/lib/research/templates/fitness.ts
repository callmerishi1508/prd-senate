import { ResearchTemplate } from '../research-schema';

export const fitnessTemplate: ResearchTemplate = {
  category: "Fitness",
  keywords: ["fitness", "workout", "exercise", "health tracker", "diet", "gym", "running", "steps"],
  competitors: [
    { name: "Strava", category: "Social Fitness", strengths: ["Community features", "GPS tracking"], weaknesses: ["Premium features are expensive"] },
    { name: "MyFitnessPal", category: "Diet & Exercise", strengths: ["Huge food database"], weaknesses: ["Cluttered UI", "Ads in free version"] },
    { name: "Apple Health / Google Fit", category: "Platform Native", strengths: ["Deep OS integration", "Hardware connectivity"], weaknesses: ["Basic analytics", "Ecosystem lock-in"] }
  ],
  commonFeatures: ["Activity Tracking", "Goal Setting", "Progress Visualization", "Social Sharing", "Integration with Wearables"],
  marketStandards: [
    { category: "Privacy", expectation: "Strict control over health data sharing." },
    { category: "Accuracy", expectation: "Reliable step and GPS tracking." },
    { category: "Interoperability", expectation: "Ability to connect to Apple HealthKit and Google Fit." }
  ],
  opportunities: [
    { title: "Gamification", description: "Implement meaningful rewards and challenges to boost retention." },
    { title: "AI Coaching", description: "Personalized workout plans adjusting dynamically to user progress." }
  ],
  risks: [
    { title: "Hardware Dependency", description: "Reliance on 3rd party APIs that can break or deprecate." },
    { title: "Low Retention", description: "Fitness apps typically suffer from high drop-off rates after January." }
  ]
};
