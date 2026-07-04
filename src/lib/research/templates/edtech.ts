import { ResearchTemplate } from '../research-schema';

export const edtechTemplate: ResearchTemplate = {
  category: "EdTech",
  keywords: ["learn", "education", "course", "student", "teacher", "class", "study", "tutor", "school"],
  competitors: [
    { name: "Coursera", category: "MOOC", strengths: ["University partnerships", "Recognized certificates"], weaknesses: ["Low completion rates"] },
    { name: "Duolingo", category: "Language Learning", strengths: ["Exceptional gamification", "Daily habit building"], weaknesses: ["Lacks deep conversational practice"] },
    { name: "Canvas", category: "LMS", strengths: ["Enterprise integration", "Comprehensive tools"], weaknesses: ["Clunky UI", "Steep learning curve for instructors"] }
  ],
  commonFeatures: ["Video Lessons", "Quizzes/Assessments", "Progress Tracking", "Discussion Forums", "Certificates"],
  marketStandards: [
    { category: "Accessibility", expectation: "Compliance with WCAG standards for disabled learners." },
    { category: "Data Privacy", expectation: "FERPA/COPPA compliance when handling student data." },
    { category: "Mobile Support", expectation: "Ability to learn on-the-go via mobile apps." }
  ],
  opportunities: [
    { title: "Personalized Learning Paths", description: "AI adapting content difficulty based on student performance." },
    { title: "Micro-learning", description: "Bite-sized, 5-minute lessons for busy professionals." }
  ],
  risks: [
    { title: "Engagement Drop-off", description: "High abandonment rates in self-paced courses." },
    { title: "Institutional Resistance", description: "Slow sales cycles when selling B2B to schools." }
  ]
};
