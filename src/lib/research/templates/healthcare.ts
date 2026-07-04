import { ResearchTemplate } from '../research-schema';

export const healthcareTemplate: ResearchTemplate = {
  category: "Healthcare",
  keywords: ["health", "medical", "doctor", "patient", "hospital", "clinic", "telehealth", "care", "prescription"],
  competitors: [
    { name: "Teladoc", category: "Telemedicine", strengths: ["Large network of doctors", "24/7 availability"], weaknesses: ["Impersonal experience", "High costs for uninsured"] },
    { name: "Epic MyChart", category: "Patient Portal", strengths: ["Deep hospital integration", "Comprehensive records"], weaknesses: ["Poor UI/UX", "Difficult to use across different providers"] },
    { name: "Zocdoc", category: "Booking", strengths: ["Easy scheduling", "Verified reviews"], weaknesses: ["Limited availability in rural areas"] }
  ],
  commonFeatures: ["Appointment Scheduling", "Secure Messaging", "Lab Results Viewer", "Prescription Refills", "Video Consultations"],
  marketStandards: [
    { category: "Compliance", expectation: "Strict HIPAA compliance and PHI protection." },
    { category: "Security", expectation: "End-to-end encryption for all telehealth sessions and messages." },
    { category: "Accessibility", expectation: "Clear, easy-to-read UI suitable for elderly or visually impaired users." }
  ],
  opportunities: [
    { title: "Remote Patient Monitoring", description: "Integrating with IoT health devices to track chronic conditions." },
    { title: "AI Triage", description: "Symptom checkers to route patients to the correct level of care." }
  ],
  risks: [
    { title: "Data Breaches", description: "Severe legal and reputational damage if health records are exposed." },
    { title: "Liability", description: "Risk of medical malpractice claims from incorrect algorithmic advice." }
  ]
};
