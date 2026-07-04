import { ResearchTemplate } from '../research-schema';

export const rideSharingTemplate: ResearchTemplate = {
  category: "Ride Sharing",
  keywords: ["ride", "taxi", "uber", "lyft", "driver", "passenger", "commute", "carpool"],
  competitors: [
    { name: "Uber", category: "Global Ride Sharing", strengths: ["Liquidity", "Brand presence"], weaknesses: ["High prices", "Driver dissatisfaction"] },
    { name: "Lyft", category: "US Ride Sharing", strengths: ["Friendly brand", "Partnerships"], weaknesses: ["Limited geographic reach"] }
  ],
  commonFeatures: ["GPS Tracking", "Live ETA", "Driver Ratings", "In-app Payments", "Ride Scheduling"],
  marketStandards: [
    { category: "Location", expectation: "Real-time accurate GPS tracking of drivers" },
    { category: "Safety", expectation: "Driver background checks and SOS features" },
    { category: "Payments", expectation: "Secure, frictionless digital transactions" }
  ],
  opportunities: [
    { title: "Electric Fleet Integration", description: "Incentivize EVs to appeal to eco-conscious users." },
    { title: "Subscription Models", description: "Predictable monthly pricing for frequent commuters." }
  ],
  risks: [
    { title: "Regulatory Pushback", description: "Gig-worker laws can drastically alter operational costs." },
    { title: "Driver Churn", description: "High turnover if incentives do not match competitor platforms." }
  ]
};
