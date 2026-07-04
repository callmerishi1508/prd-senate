"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saasTemplate = void 0;
exports.saasTemplate = {
    category: "B2B SaaS",
    keywords: ["b2b", "saas", "enterprise", "business", "software", "subscription", "team", "workspace", "crm", "erp"],
    competitors: [
        { name: "Salesforce", category: "CRM", strengths: ["Extremely customizable", "Massive ecosystem"], weaknesses: ["Complex setup", "Expensive"] },
        { name: "Slack", category: "Communication", strengths: ["Intuitive UI", "Great integrations"], weaknesses: ["Notification fatigue", "Search can be difficult"] },
        { name: "Jira", category: "Project Management", strengths: ["Powerful agile tools", "Deep reporting"], weaknesses: ["Slow", "Overwhelming for non-technical users"] }
    ],
    commonFeatures: ["Role-Based Access Control (RBAC)", "Single Sign-On (SSO)", "Billing Management", "Audit Logs", "API Access"],
    marketStandards: [
        { category: "Security", expectation: "SOC2 Compliance and Enterprise-grade SSO (SAML/OAuth)." },
        { category: "Reliability", expectation: "99.9% or higher guaranteed uptime SLAs." },
        { category: "Onboarding", expectation: "Self-serve documentation and guided product tours." }
    ],
    opportunities: [
        { title: "Product-Led Growth", description: "Freemium models that allow bottoms-up adoption within companies." },
        { title: "AI Automation", description: "Automating routine tasks and generating insights from business data." }
    ],
    risks: [
        { title: "High Churn", description: "Failure to prove ROI quickly leads to canceled subscriptions." },
        { title: "Security Reviews", description: "Long sales cycles blocked by enterprise IT security audits." }
    ]
};
