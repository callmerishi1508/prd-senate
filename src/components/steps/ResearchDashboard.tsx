"use client"

import { useAppStore } from "@/store/useAppStore"
import { Search, Loader2, CheckCircle2 } from "lucide-react"
import { ResearchReport } from "@/lib/research/research-schema"

const researchSteps = [
  { id: 'thinking', label: 'Analyzing problem statement and context...' },
  { id: 'drafting', label: 'Product Strategist is drafting initial PRD...' },
  { id: 'critiquing', label: 'Expert Agents are preparing for debate...' }
]

export function ResearchDashboard() {
  const { activeAgent, researchData: rawResearchData } = useAppStore()
  const researchData = rawResearchData as unknown as ResearchReport | null;

  // Determine current visual step based on active agent
  let currentStepIndex = 0
  if (activeAgent.status === 'drafting') currentStepIndex = 1
  if (activeAgent.status === 'critiquing') currentStepIndex = 2
  if (activeAgent.status === 'verifying' || activeAgent.status === 'finalizing' || activeAgent.status === 'done') currentStepIndex = 3

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm w-full">
        <div className="flex items-center gap-3 mb-8 text-blue-900">
          <Search className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Research Phase</h2>
        </div>

        <div className="space-y-4">
          {researchSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex

            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  isCurrent ? 'bg-blue-50 border border-blue-100' : ''
                }`}
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-slate-700' :
                  isCurrent ? 'text-blue-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {researchData && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-slate-800 mb-4">Research Report Findings</h3>
          <div className="space-y-4 text-sm">
            <div className="flex gap-4">
              <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                Category: {researchData.productCategory || 'Unknown'}
              </div>
              <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                Confidence: {researchData.researchConfidence || 0}%
              </div>
            </div>

            {researchData.categoryScores && researchData.categoryScores.length > 0 && (
              <div>
                <strong className="text-slate-700">Top 3 Category Signals:</strong>
                <div className="flex gap-2 mt-1">
                  {researchData.categoryScores.map((scoreObj: { category: string, score: number }, i: number) => (
                    <span key={i} className="text-xs border border-blue-200 px-2 py-1 rounded bg-blue-50 text-blue-700">
                      {scoreObj.category}: {scoreObj.score}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <strong className="text-slate-700">Research Sources:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {(researchData.researchSources || []).map((source: string, i: number) => (
                   <span key={i} className="text-xs border border-slate-200 px-2 py-1 rounded bg-slate-50 text-slate-600">{source}</span>
                ))}
              </div>
            </div>

            <div>
              <strong className="text-slate-700">Competitors Found:</strong>
              <ul className="list-disc pl-5 mt-1 text-slate-600">
                {(researchData.competitors || []).map((c, i: number) => (
                  <li key={i}>{c.name} <span className="text-slate-400">({c.category})</span></li>
                ))}
              </ul>
            </div>

            <div>
              <strong className="text-slate-700">Market Standards:</strong>
              <ul className="list-disc pl-5 mt-1 text-slate-600">
                {(researchData.marketStandards || []).map((ms, i: number) => (
                  <li key={i}><strong>{ms.category}:</strong> {ms.expectation}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="text-green-700">Opportunities:</strong>
                <ul className="list-disc pl-5 mt-1 text-slate-600">
                  {(researchData.opportunities || []).map((opp, i: number) => (
                    <li key={i}>{opp.title}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-red-700">Risks:</strong>
                <ul className="list-disc pl-5 mt-1 text-slate-600">
                  {(researchData.risks || []).map((risk, i: number) => (
                    <li key={i}>{risk.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
