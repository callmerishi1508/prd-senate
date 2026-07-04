import { ResearchTemplate } from '../research-schema';

export const socialMediaTemplate: ResearchTemplate = {
  category: "Social Media",
  keywords: ["social", "network", "friends", "feed", "post", "share", "chat", "community"],
  competitors: [
    { name: "Instagram", category: "Visual Content", strengths: ["Huge user base", "Strong influencer network"], weaknesses: ["Algorithmic feed complaints", "Mental health concerns"] },
    { name: "TikTok", category: "Short-form Video", strengths: ["Highly engaging algorithm", "Trend creation"], weaknesses: ["Data privacy scrutiny", "Short attention span focus"] },
    { name: "X / Twitter", category: "Real-time Text", strengths: ["Breaking news", "Direct interaction with public figures"], weaknesses: ["Toxicity", "Monetization challenges"] }
  ],
  commonFeatures: ["User Profiles", "Content Feed", "Likes/Comments/Shares", "Direct Messaging", "Notifications"],
  marketStandards: [
    { category: "Moderation", expectation: "Tools to report and filter abusive content." },
    { category: "Privacy", expectation: "Clear controls over profile visibility and data usage." },
    { category: "Performance", expectation: "Infinite scroll with smooth content loading." }
  ],
  opportunities: [
    { title: "Niche Communities", description: "Focusing on specific interests rather than broad, generic networks." },
    { title: "Creator Monetization", description: "Built-in tools for creators to earn directly from their audience." }
  ],
  risks: [
    { title: "Platform Decay", description: "Users migrating to newer platforms as the network ages." },
    { title: "Regulatory Action", description: "Increasing governmental scrutiny over data and content moderation." }
  ]
};
