"use client"

import { useState, useEffect } from 'react'
import { PRDVersion, RequirementChange, ImpactReport, EvolutionSummary } from '@/lib/versioning/version-schema'
import { History, ArrowRight, GitMerge, FileWarning } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function VersionDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedV1, setSelectedV1] = useState<string>('')
  const [selectedV2, setSelectedV2] = useState<string>('')
  
  const [changes, setChanges] = useState<RequirementChange[]>([])
  const [summary, setSummary] = useState<EvolutionSummary | null>(null)
  const [impactMap, setImpactMap] = useState<Record<string, ImpactReport>>({})
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => {
        setVersions(data)
        if (data.length >= 2) {
          setSelectedV1(data[1].id)
          setSelectedV2(data[0].id)
        }
      })
  }, [projectId])

  useEffect(() => {
    if (selectedV1 && selectedV2) {
      fetch(`/api/versions?action=compare&v1=${selectedV1}&v2=${selectedV2}`)
        .then(r => r.json())
        .then(data => {
          setChanges(data.changes || [])
          setSummary(data.summary || null)
          setImpactMap({})
        })
    }
  }, [selectedV1, selectedV2])

  const analyzeImpact = async (change: RequirementChange) => {
    const res = await fetch(`/api/versions?action=impact&v1=${selectedV1}&entityId=${change.entityId}&entityType=${change.entityType}`)
    const data = await res.json()
    setImpactMap(prev => ({ ...prev, [change.entityId]: data }))
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5"/> Version History & Diff Engine</h2>
          <p className="text-sm text-slate-500">Track PRD evolution and analyze the impact of changes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select value={selectedV1} onChange={e => setSelectedV1(e.target.value)} className="border p-2 rounded">
            <option value="">Base Version</option>
            {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNumber} ({v.title})</option>)}
          </select>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <select value={selectedV2} onChange={e => setSelectedV2(e.target.value)} className="border p-2 rounded">
            <option value="">Target Version</option>
            {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNumber} ({v.title})</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        
        {/* EVOLUTION SUMMARY */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><GitMerge className="w-4 h-4"/> Evolution Summary</h3>
          {summary ? (
            <div className="space-y-4 text-sm">
              {summary.added.length > 0 && (
                <div><h4 className="font-semibold text-green-700">Added:</h4><ul className="list-disc pl-4 text-green-600">{summary.added.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
              )}
              {summary.modified.length > 0 && (
                <div><h4 className="font-semibold text-yellow-700">Modified:</h4><ul className="list-disc pl-4 text-yellow-600">{summary.modified.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
              )}
              {summary.removed.length > 0 && (
                <div><h4 className="font-semibold text-red-700">Removed:</h4><ul className="list-disc pl-4 text-red-600">{summary.removed.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
              )}
              {summary.added.length===0 && summary.modified.length===0 && summary.removed.length===0 && (
                <p className="text-slate-500 italic">No changes between these versions.</p>
              )}
            </div>
          ) : <p className="text-sm text-slate-500">Select versions to compare.</p>}
        </div>

        {/* DIFF VIEWER */}
        <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileWarning className="w-4 h-4"/> Change Details & Impact Analysis</h3>
          {changes.map((c, i) => {
            const colorClass = 
              c.type === 'ADDED' ? 'border-green-200 bg-green-50' : 
              c.type === 'REMOVED' ? 'border-red-200 bg-red-50' : 
              'border-yellow-200 bg-yellow-50'

            const impact = impactMap[c.entityId]

            return (
              <div key={i} className={`p-3 rounded border ${colorClass} text-sm flex flex-col gap-2`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold mr-2">{c.type} {c.entityType} [{c.entityId}]</span>
                  </div>
                  {(c.type === 'REMOVED' || c.type === 'MODIFIED') && !impact && (
                    <button onClick={() => analyzeImpact(c)} className="text-xs bg-white border shadow-sm px-2 py-1 rounded hover:bg-slate-50">Analyze Impact</button>
                  )}
                </div>
                
                {c.before && <div className="text-red-700 line-through opacity-70">- {c.before}</div>}
                {c.after && <div className="text-green-700">+ {c.after}</div>}

                {/* IMPACT RENDERER */}
                {impact && (
                  <div className="mt-2 p-2 bg-white rounded border border-slate-200 shadow-inner">
                    <strong className="text-xs text-slate-500 uppercase">Impact Analysis</strong>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {impact.affectedGoals.length > 0 && <div><span className="font-medium text-slate-700">Goals:</span> {impact.affectedGoals.join(', ')}</div>}
                      {impact.affectedRequirements.length > 0 && <div><span className="font-medium text-slate-700">Reqs:</span> {impact.affectedRequirements.join(', ')}</div>}
                      {impact.affectedStories.length > 0 && <div><span className="font-medium text-slate-700">Stories:</span> {impact.affectedStories.join(', ')}</div>}
                      {impact.affectedMetrics.length > 0 && <div><span className="font-medium text-slate-700">Metrics:</span> {impact.affectedMetrics.join(', ')}</div>}
                      {Object.values(impact).every(arr => arr.length === 0) && <div className="text-slate-400 italic text-xs">No downstream elements affected.</div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
