import { DeliveryArtifacts, ReadinessReport } from './delivery-schema';

export function calculateReadiness(
  artifacts: DeliveryArtifacts,
  executionIssues: string[],
  qualityGateDecision: "APPROVE" | "REJECT",
  qualityGateIssues: string[]
): ReadinessReport {
  const reasons: string[] = [];
  let status: "READY" | "NOT_READY" | "BLOCKED" = "READY";

  if (executionIssues.length > 0) {
    status = "BLOCKED";
    reasons.push("Execution Validator found structural issues: " + executionIssues.join("; "));
  }

  if (qualityGateDecision === "REJECT") {
    status = "BLOCKED";
    reasons.push("Delivery Quality Gate rejected the plan: " + qualityGateIssues.join("; "));
  }

  if (artifacts.riskReport && (artifacts.riskReport.level === "CRITICAL" || artifacts.riskReport.level === "HIGH")) {
    if (status !== "BLOCKED") status = "NOT_READY";
    reasons.push(`High/Critical delivery risks detected: ${artifacts.riskReport.risks.join("; ")}`);
  }

  if (status === "READY") {
    reasons.push("All engineering tasks are sized, sprint capacity is balanced, and quality gates passed.");
  }

  return { status, reasons };
}
