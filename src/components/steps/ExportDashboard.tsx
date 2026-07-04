import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { Download, FileJson, FileText, Code } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function ExportDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => setVersions(data))
  }, [projectId])

  const handleDownload = (type: string) => {
    const version = versions.find(v => v.id === selectedVersionId)
    if (!version) return

    let content = ''
    let filename = ''
    let mimeType = 'application/json'

    if (type === 'prd-json') {
      content = JSON.stringify(version.structuredPRD, null, 2)
      filename = `prd-${version.versionNumber}.json`
    } else if (type === 'planning-json') {
      content = JSON.stringify(version.planningArtifacts, null, 2)
      filename = `planning-${version.versionNumber}.json`
    } else if (type === 'delivery-json') {
      content = JSON.stringify(version.deliveryArtifacts, null, 2)
      filename = `delivery-${version.versionNumber}.json`
    } else if (type === 'prd-md') {
      content = JSON.stringify(version.structuredPRD, null, 2)
      filename = `prd-${version.versionNumber}.md`
      mimeType = 'text/markdown'
    }

    if (!content) return

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Download className="w-5 h-5"/> Export Data</h2>
        <p className="text-sm text-slate-500 mt-1">Download raw JSON or Markdown versions of your artifacts.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 mb-1">Select Version to Export</label>
          <select value={selectedVersionId} onChange={e => setSelectedVersionId(e.target.value)} className="w-full border p-2 rounded bg-slate-50">
            <option value="">-- Choose a Version --</option>
            {versions.map(v => (
              <option key={v.id} value={v.id}>v{v.versionNumber}: {v.title} ({v.status})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedVersionId && (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleDownload('prd-json')} className="p-4 border rounded hover:bg-slate-50 flex items-center gap-3">
            <FileJson className="w-6 h-6 text-blue-500"/>
            <div className="text-left">
              <div className="font-bold">PRD (JSON)</div>
              <div className="text-xs text-slate-500">Structured product requirements</div>
            </div>
          </button>
          <button onClick={() => handleDownload('prd-md')} className="p-4 border rounded hover:bg-slate-50 flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-500"/>
            <div className="text-left">
              <div className="font-bold">PRD (Markdown)</div>
              <div className="text-xs text-slate-500">Human-readable document</div>
            </div>
          </button>
          <button onClick={() => handleDownload('planning-json')} className="p-4 border rounded hover:bg-slate-50 flex items-center gap-3" disabled={!versions.find(v => v.id === selectedVersionId)?.planningArtifacts}>
            <Code className="w-6 h-6 text-purple-500"/>
            <div className="text-left">
              <div className="font-bold">Planning Artifacts (JSON)</div>
              <div className="text-xs text-slate-500">Epics, Roadmaps, Dependencies</div>
            </div>
          </button>
          <button onClick={() => handleDownload('delivery-json')} className="p-4 border rounded hover:bg-slate-50 flex items-center gap-3" disabled={!versions.find(v => v.id === selectedVersionId)?.deliveryArtifacts}>
            <Code className="w-6 h-6 text-green-500"/>
            <div className="text-left">
              <div className="font-bold">Delivery Artifacts (JSON)</div>
              <div className="text-xs text-slate-500">Sprints, Tasks, Capacity</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
