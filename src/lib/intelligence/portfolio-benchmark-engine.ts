import { PortfolioInsight, DeliveryForecast, ExecutiveReport } from './intelligence-schema';
import { getAllKnowledgeChunks } from '../knowledge/memory-manager';

export async function generatePortfolioBenchmarks(
  currentForecast: DeliveryForecast
): Promise<PortfolioInsight[]> {
  const insights: PortfolioInsight[] = [];
  
  const currentSuccess = currentForecast.confidenceInterval;
  
  let historicalBaselineSuccess = 87;
  try {
    const chunks = await getAllKnowledgeChunks();
    const reports = chunks
      .filter(c => c.chunkType === "EXECUTIVE_REPORT")
      .map(c => {
         try { return JSON.parse(c.content) as ExecutiveReport; }
         catch(e) { return null; }
      })
      .filter(r => r !== null) as ExecutiveReport[];
      
    if (reports.length > 0) {
      let sum = 0;
      for (const r of reports) {
        sum += r.forecast.confidenceInterval;
      }
      historicalBaselineSuccess = sum / reports.length;
    }
  } catch(e) {}

  let status: "OUTPERFORMING" | "ON_TRACK" | "UNDERPERFORMING" = "ON_TRACK";
  if (currentSuccess < historicalBaselineSuccess - 10) status = "UNDERPERFORMING";
  else if (currentSuccess > historicalBaselineSuccess + 10) status = "OUTPERFORMING";

  insights.push({
    metric: "Forecast Success",
    currentValue: currentSuccess,
    historicalBaseline: historicalBaselineSuccess,
    variance: currentSuccess - historicalBaselineSuccess,
    status
  });

  return insights;
}
