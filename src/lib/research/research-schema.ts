export interface Competitor {
  name: string;
  category: string;
  strengths: string[];
  weaknesses: string[];
}

export interface MarketStandard {
  category: string;
  expectation: string;
}

export interface Opportunity {
  title: string;
  description: string;
}

export interface Risk {
  title: string;
  description: string;
}

export interface ResearchReport {
  productCategory: string;
  researchConfidence: number;
  categoryScores?: { category: string; score: number }[];
  researchSources: string[];
  competitors: Competitor[];
  commonFeatures: string[];
  marketStandards: MarketStandard[];
  opportunities: Opportunity[];
  risks: Risk[];
}

export interface ResearchTemplate {
  category: string;
  keywords: string[];
  competitors: Competitor[];
  commonFeatures: string[];
  marketStandards: MarketStandard[];
  opportunities: Opportunity[];
  risks: Risk[];
}
