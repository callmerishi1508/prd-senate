export interface ProductHealthScore {
  score: number; // 0-100
  rating: "Excellent" | "Healthy" | "Warning" | "Critical";
  metrics: {
    requirementStability: number;
    reviewChurn: number;
    scopeGrowth: number;
    sprintPredictability: number;
    planningVolatility: number;
  };
}

export interface RoadmapRisk {
  epicId: string;
  epicTitle: string;
  type: "DELIVERY" | "DEPENDENCY" | "RESOURCE" | "INTEGRATION";
  probability: number; // 0-100
  impact: number; // 0-100
  recommendedActions: string[];
}

export interface DeliveryForecast {
  expectedCompletionDate: string;
  confidenceInterval: number; // e.g. 85 for 85%
  scheduleSlippageRisk: number; // 0-100
  velocityTrend: number; // +/- percentage
}

export interface PortfolioInsight {
  metric: string;
  currentValue: number;
  historicalBaseline: number;
  variance: number;
  status: "OUTPERFORMING" | "ON_TRACK" | "UNDERPERFORMING";
}

export interface Recommendation {
  id: string;
  type: string; // e.g. "CAPACITY_INCREASE", "SCOPE_REDUCTION"
  action: string;
  confidence: number;
  evidence: string[];
}

export interface ExecutiveReport {
  id: string;
  versionId: string;
  generatedAt: string;
  health: ProductHealthScore;
  forecast: DeliveryForecast;
  driftScore: number;
  driftSeverity: "Low" | "Medium" | "High" | "Critical";
  topRisks: RoadmapRisk[];
  recommendations: Recommendation[];
  benchmarkInsights?: PortfolioInsight[];
  aiSummary?: string;
}
