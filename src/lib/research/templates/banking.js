"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankingTemplate = void 0;
exports.bankingTemplate = {
    category: "Banking",
    keywords: ["bank", "finance", "fintech", "money", "wallet", "credit", "transfer", "invest", "crypto"],
    competitors: [
        { name: "Revolut", category: "Neobank", strengths: ["Multi-currency", "Low fees", "Crypto"], weaknesses: ["Limited physical presence", "Customer support bottlenecks"] },
        { name: "Monzo", category: "Neobank", strengths: ["Excellent UI/UX", "Budgeting tools"], weaknesses: ["Limited international features"] },
        { name: "Chase", category: "Traditional Bank", strengths: ["High trust", "Extensive branch network"], weaknesses: ["Slower to innovate digitally", "Higher fees"] }
    ],
    commonFeatures: ["Balance View", "Peer-to-peer Transfers", "Card Management", "Direct Deposit", "Push Notifications"],
    marketStandards: [
        { category: "Security", expectation: "Multi-Factor Authentication (MFA) on all logins" },
        { category: "Compliance", expectation: "KYC/AML protocols integrated seamlessly" },
        { category: "Data", expectation: "End-to-end encryption and strict audit logs" }
    ],
    opportunities: [
        { title: "Automated Savings", description: "AI-driven micro-savings and investment routing." },
        { title: "Hyper-personalization", description: "Customized financial advice based on transaction history." }
    ],
    risks: [
        { title: "Security Breaches", description: "Catastrophic loss of trust if user data or funds are compromised." },
        { title: "Regulatory Fines", description: "Heavy penalties for non-compliance with regional financial laws." }
    ]
};
