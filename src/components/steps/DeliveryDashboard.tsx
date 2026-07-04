"use client"

import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { DeliveryArtifacts } from '@/lib/delivery/delivery-schema'
import { Truck, Activity, Calendar, AlertCircle, CheckCircle, RefreshCcw, ShieldAlert, Code } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function DeliveryDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedVId, setSelectedVId] = useState<string>('')
  const [artifacts, setArtifacts] = useState<DeliveryArtifacts | null>(null)
  
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [teamSize, setTeamSize] = useState(5)
  const [velocity, setVelocity] = useState(8)
  const [sprintWeeks, setSprintWeeks] = useState(2)
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => {
        setVersions(data)
        if (data.length > 0) {
          const approved = data.find((v: PRDVersion) => v.status === 'APPROVED' && v.planningArtifacts)
          setSelectedVId(approved ? approved.id : data[0].id)
        }
      })
  }, [projectId])

  useEffect(() => {
    if (selectedVId) {
      const v = versions.find(v => v.id === selectedVId)
      if (v?.deliveryArtifacts) {
        setArtifacts(v.deliveryArtifacts)
      } else {
        setArtifacts(null)
      }
    }
  }, [selectedVId, versions])

  const generateDelivery = async () => {
    if (!selectedVId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId: selectedVId, teamSize, velocityPerDev: velocity, sprintWeeks })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error + (data.issues ? ': ' + data.issues.join('; ') : ''))
      }
      setArtifacts(data.deliveryArtifacts)
      const versionsRes = await fetch('/api/versions')
      setVersions(await versionsRes.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const selectedVersion = versions.find(v => v.id === selectedVId)
  const canGenerate = selectedVersion?.status === 'APPROVED' && selectedVersion?.planningArtifacts

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Truck className="w-5 h-5"/> Delivery & Sprint Plan</h2>
          <p className="text-sm text-slate-500">Transform Roadmaps into execution-ready Tasks and Sprints.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              <label>Team:</label>
              <input type="number" value={teamSize} onChange={e=>setTeamSize(Number(e.target.value))} className="w-16 border rounded px-1"/>
              <label>Velocity/Dev:</label>
              <input type="number" value={velocity} onChange={e=>setVelocity(Number(e.target.value))} className="w-16 border rounded px-1"/>
            </div>
          </div>
          <select value={selectedVId} onChange={e => setSelectedVId(e.target.value)} className="border p-2 rounded">
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({v.title}) {v.status === 'APPROVED' ? '✅' : '⚠️'} {v.planningArtifacts ? '📅' : ''}
              </option>
            ))}
          </select>
          <button 
            onClick={generateDelivery}
            disabled={generating || !canGenerate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

      {!canGenerate && !artifacts && !error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-yellow-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Delivery planning requires an <b>APPROVED PRD</b> with an established <b>Roadmap</b>. Please complete the Planning phase first.</p>
        </div>
      )}

      {artifacts && (
        <div className="flex-1 overflow-y-auto space-y-6 pb-12">
          {/* Readiness & Risks */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border shadow-sm ${artifacts.readinessReport?.status === 'READY' ? 'bg-green-50 border-green-200 text-green-800' : artifacts.readinessReport?.status === 'NOT_READY' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> 
                Readiness: {artifacts.readinessReport?.status}
              </h3>
              <ul className="text-sm list-disc pl-4 space-y-1">
                {artifacts.readinessReport?.reasons.map((r,i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            
            <div className={`p-4 rounded-xl border shadow-sm ${artifacts.riskReport?.level === 'LOW' ? 'bg-green-50 border-green-200 text-green-800' : artifacts.riskReport?.level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> 
                Risk Level: {artifacts.riskReport?.level}
              </h3>
              <ul className="text-sm list-disc pl-4 space-y-1">
                {artifacts.riskReport?.risks.length ? artifacts.riskReport.risks.map((r,i) => <li key={i}>{r}</li>) : <li>No significant risks detected.</li>}
              </ul>
            </div>
          </div>

          {/* Sprints */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Calendar className="w-5 h-5"/> Sprint Allocations</h3>
            <div className="grid grid-cols-1 gap-4">
              {artifacts.sprints.map(sprint => (
                <div key={sprint.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h4 className="font-bold text-indigo-800">{sprint.name}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${sprint.assignedPoints > sprint.capacityPoints ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {sprint.assignedPoints} / {sprint.capacityPoints} pts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sprint.tasks.map(tId => {
                      const task = artifacts.tasks.find(t => t.id === tId)
                      if (!task) return null;
                      return (
                        <div key={task.id} className="bg-slate-50 border border-slate-200 rounded p-3 text-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-slate-800 line-clamp-1" title={task.title}>{task.title}</span>
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">{task.storyPoints} pts</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                          </div>
                          <div className="mt-3 flex justify-between items-center text-[10px] font-medium text-slate-400">
                            <span>{task.id}</span>
                            <span className="bg-slate-200 text-slate-700 px-1.5 rounded">{task.requiredRole}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
