"use client"

import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { PlanningArtifacts, Epic, Milestone } from '@/lib/planning/planning-schema'
import { Layout, Calendar, Layers, Activity, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function PlanningDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedVId, setSelectedVId] = useState<string>('')
  const [artifacts, setArtifacts] = useState<PlanningArtifacts | null>(null)
  
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => {
        setVersions(data)
        if (data.length > 0) {
          const approved = data.find((v: PRDVersion) => v.status === 'APPROVED')
          setSelectedVId(approved ? approved.id : data[0].id)
        }
      })
  }, [projectId])

  useEffect(() => {
    if (selectedVId) {
      const v = versions.find(v => v.id === selectedVId)
      if (v?.planningArtifacts) {
        setArtifacts(v.planningArtifacts)
      } else {
        setArtifacts(null)
      }
    }
  }, [selectedVId, versions])

  const generatePlanning = async () => {
    if (!selectedVId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId: selectedVId })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error + (data.issues ? ': ' + data.issues.join('; ') : ''))
      }
      setArtifacts(data.planningArtifacts)
      // refresh versions
      const versionsRes = await fetch('/api/versions')
      setVersions(await versionsRes.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const selectedVersion = versions.find(v => v.id === selectedVId)

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Layout className="w-5 h-5"/> Planning & Roadmaps</h2>
          <p className="text-sm text-slate-500">Transform approved PRDs into Epics, Release Plans, and Roadmaps.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select value={selectedVId} onChange={e => setSelectedVId(e.target.value)} className="border p-2 rounded">
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({v.title}) {v.status === 'APPROVED' ? '✅' : '⚠️'}
              </option>
            ))}
          </select>
          <button 
            onClick={generatePlanning}
            disabled={generating || selectedVersion?.status !== 'APPROVED'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {selectedVersion?.status !== 'APPROVED' && !artifacts && !error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-yellow-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Planning requires an <b>APPROVED</b> PRD Version. Please review and approve this version first.</p>
        </div>
      )}

      {artifacts && (
        <div className="flex-1 overflow-y-auto space-y-6 pb-12">
          {/* Roadmap & Releases */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Calendar className="w-5 h-5"/> Release Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {artifacts.releasePlan.milestones.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                  <h4 className="font-bold text-blue-800 border-b pb-2 mb-3">{m.title}</h4>
                  <div className="flex-1 space-y-2">
                    {m.epics.map(epicId => {
                      const epic = artifacts.epics.find(e => e.id === epicId)
                      if (!epic) return null
                      return (
                        <div key={epic.id} className="bg-slate-50 border rounded p-2 text-sm">
                          <div className="font-semibold text-slate-700">{epic.title}</div>
                          <div className="text-xs text-slate-500 flex justify-between mt-1">
                            <span>{epic.priority}</span>
                            <span>{epic.estimatedEffort}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Epics Details */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Layers className="w-5 h-5"/> Epics</h3>
            <div className="space-y-3">
              {artifacts.epics.map(epic => (
                <div key={epic.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800">{epic.title} <span className="text-xs text-slate-400 font-normal">[{epic.id}]</span></h4>
                      <p className="text-sm text-slate-600 mt-1">{epic.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${epic.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : epic.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {epic.priority}
                      </span>
                      <span className="px-2 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700">
                        {epic.estimatedEffort} ({epic.estimatedWeeks}w)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    <strong>Reqs:</strong> {epic.relatedRequirements.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Path & Dependencies */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity className="w-5 h-5"/> Critical Path</h3>
              {artifacts.criticalPath && artifacts.criticalPath.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {artifacts.criticalPath.map((node, i) => {
                    const e = artifacts.epics.find(x => x.id === node)
                    return (
                      <div key={node} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                        <span className="text-sm font-medium text-slate-700">{e ? e.title : node}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No critical path detected.</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-auto">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity className="w-5 h-5"/> Dependencies</h3>
              {artifacts.dependencies.length > 0 ? (
                <ul className="space-y-2">
                  {artifacts.dependencies.map((d, i) => {
                    const fromE = artifacts.epics.find(x => x.id === d.from)
                    const toE = artifacts.epics.find(x => x.id === d.to)
                    return (
                      <li key={i} className="text-sm flex items-center gap-2 text-slate-600">
                        <span className="font-medium">{fromE ? fromE.title : d.from}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${d.type==='BLOCKS'?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}>{d.type}</span>
                        <span className="font-medium">{toE ? toE.title : d.to}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No dependencies detected.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
