import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { BrainCircuit, Activity, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function IntelligenceDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => setVersions(data))
  }, [projectId])

  const latestDelivery = versions.filter(v => v.deliveryArtifacts).pop()

  if (!latestDelivery) {
    return (
      <div className="flex items-center justify-center h-full flex-col text-slate-500">
        <BrainCircuit className="w-12 h-12 mb-4 text-slate-300" />
        <p>No delivery plans generated yet. Complete the Delivery step to see intelligence insights.</p>
      </div>
    )
  }

  const { planningArtifacts, deliveryArtifacts } = latestDelivery
  
  const totalPoints = deliveryArtifacts?.sprints.reduce((acc, s) => acc + s.assignedPoints, 0) || 0
  const sprintCount = deliveryArtifacts?.sprints.length || 1
  const velocity = Math.round(totalPoints / sprintCount)
  const risks = deliveryArtifacts?.riskReport?.risks || []
  const blockers = planningArtifacts?.dependencies.filter(d => d.type === 'BLOCKS') || []
  
  // Simulated intelligence metrics based on artifacts
  const healthScore = Math.max(0, 100 - (risks.length * 5) - (blockers.length * 10))
  const forecastConfidence = Math.max(0, 100 - (risks.length * 8))
  
  const recommendations = []
  if (healthScore < 70) recommendations.push("High execution risk detected. Consider descoping non-critical epics.")
  if (blockers.length > 2) recommendations.push("Dependency bottleneck identified. Reassign resources to unblock critical path.")
  if (velocity < 10) recommendations.push("Low average velocity. Verify team capacity and story point estimates.")
  if (recommendations.length === 0) recommendations.push("Execution plan looks solid. Proceed with current roadmap.")

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BrainCircuit className="w-5 h-5"/> Executive Intelligence</h2>
        <p className="text-sm text-slate-500 mt-1">High-level insights into roadmap velocity, health, and execution risks.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Activity className="w-8 h-8 text-blue-500 mb-2"/>
          <div className="text-3xl font-bold text-slate-800">{healthScore}/100</div>
          <div className="text-xs text-slate-500 uppercase font-bold mt-1">Health Score</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-8 h-8 text-green-500 mb-2"/>
          <div className="text-3xl font-bold text-slate-800">{forecastConfidence}%</div>
          <div className="text-xs text-slate-500 uppercase font-bold mt-1">Forecast Confidence</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-orange-500 mb-2"/>
          <div className="text-3xl font-bold text-slate-800">{blockers.length}</div>
          <div className="text-xs text-slate-500 uppercase font-bold mt-1">Open Blockers</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Activity className="w-8 h-8 text-purple-500 mb-2"/>
          <div className="text-3xl font-bold text-slate-800">{velocity}</div>
          <div className="text-xs text-slate-500 uppercase font-bold mt-1">Velocity (pts/sprint)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">AI Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            {recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Execution Risks</h3>
          {risks.length === 0 ? (
            <p className="text-sm text-slate-500">No major risks identified.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              {risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Dependency Blockers</h3>
          {blockers.length === 0 ? (
            <p className="text-sm text-slate-500">No blocking dependencies.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              {blockers.map((b, i) => {
                 const fromEpic = planningArtifacts?.epics.find(e => e.id === b.from)?.title || b.from;
                 const toEpic = planningArtifacts?.epics.find(e => e.id === b.to)?.title || b.to;
                 return <li key={i}><strong>{fromEpic}</strong> blocks <strong>{toEpic}</strong></li>
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
