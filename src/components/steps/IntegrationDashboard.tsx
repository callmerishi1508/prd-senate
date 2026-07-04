"use client"

import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { SyncJob } from '@/lib/integrations/integration-schema'
import { Link, RefreshCw, AlertCircle, CheckCircle, Clock, History } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function IntegrationDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [system, setSystem] = useState<string>('GITHUB')
  const [history, setHistory] = useState<SyncJob[]>([])
  const [syncing, setSyncing] = useState(false)
  const [validation, setValidation] = useState<any>(null)
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => setVersions(data))
    fetchHistory()
  }, [projectId])

  const fetchHistory = () => {
    fetch(`/api/integrations?action=history${projectId ? `&projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => setHistory(data))
  }

  const handleSync = async () => {
    if (!selectedVersionId) return
    setSyncing(true)
    setValidation(null)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', versionId: selectedVersionId, system })
      })
      const data = await res.json()
      setValidation(data.validation)
      fetchHistory()
    } finally {
      setSyncing(false)
    }
  }

  const handleRetry = async (jobId: string) => {
    setSyncing(true)
    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', jobId })
      })
      fetchHistory()
    } finally {
      setSyncing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'SUCCESS') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'FAILED') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Link className="w-5 h-5"/> Integration & Execution Sync</h2>
        <p className="text-sm text-slate-500 mt-1">Push your delivery plans directly into engineering execution tools.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-1">Select Delivery Plan</label>
          <select value={selectedVersionId} onChange={e => setSelectedVersionId(e.target.value)} className="w-full border p-2 rounded bg-slate-50">
            <option value="">-- Choose a Version --</option>
            {versions.filter(v => v.deliveryArtifacts).map(v => (
              <option key={v.id} value={v.id}>v{v.versionNumber}: {v.title}</option>
            ))}
          </select>
        </div>
        <div className="w-64">
          <label className="block text-sm font-bold text-slate-700 mb-1">Target System</label>
          <select value={system} onChange={e => setSystem(e.target.value)} className="w-full border p-2 rounded bg-slate-50">
            <option value="GITHUB">GitHub</option>
            <option value="JIRA">Jira</option>
            <option value="LINEAR">Linear</option>
            <option value="AZURE_DEVOPS">Azure DevOps</option>
          </select>
        </div>
        <button 
          onClick={handleSync}
          disabled={!selectedVersionId || syncing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Link className="w-4 h-4"/>}
          Push to {system}
        </button>
      </div>

      {validation && !validation.isValid && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-800 text-sm">
          <h3 className="font-bold flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4"/> Traceability / Validation Issues Found</h3>
          <ul className="list-disc pl-5">
            {validation.issues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
          </ul>
        </div>
      )}

      {validation && validation.isValid && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5"/> Sync Completed & Traceability 100% Intact
        </div>
      )}

      <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="w-4 h-4"/> Sync History</h3>
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">No integrations run yet.</p>
        ) : (
          <div className="space-y-4">
            {history.slice().reverse().map(job => (
              <div key={job.id} className="border rounded-lg p-3 text-sm bg-slate-50 relative shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-slate-700">{job.system} Sync</div>
                  <div className="flex items-center gap-2">
                    {job.status === 'FAILED' && (
                      <button onClick={() => handleRetry(job.id)} disabled={syncing} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-bold transition-colors">
                        Retry Failed
                      </button>
                    )}
                    {getStatusIcon(job.status)}
                  </div>
                </div>
                <div className="text-slate-500 text-xs mb-3 font-medium">Started: {new Date(job.createdAt).toLocaleString()}</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200 text-center font-bold text-slate-600 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-slate-400">Total</span>
                    <span className="text-base">{job.results.length}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded border border-green-200 text-center font-bold text-green-700 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-green-500">Success</span>
                    <span className="text-base">{job.results.filter(r => r.status === 'SUCCESS').length}</span>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200 text-center font-bold text-red-700 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-red-500">Failed</span>
                    <span className="text-base">{job.results.filter(r => r.status === 'FAILED').length}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center font-bold text-blue-700 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase text-blue-500">Retries</span>
                    <span className="text-base">{job.results.reduce((acc, r) => acc + r.retryCount, 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
