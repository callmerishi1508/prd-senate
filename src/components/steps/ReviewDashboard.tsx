"use client"

import { useState, useEffect } from 'react'
import { PRDVersion } from '@/lib/versioning/version-schema'
import { ReviewSession, Comment, EntityReviewStatus, CollaborationEntityType } from '@/lib/collaboration/collaboration-schema'
import { ReviewSummary } from '@/lib/collaboration/review-manager'
import { CheckCircle, XCircle, AlertCircle, Clock, MessageSquare, Save } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function ReviewDashboard() {
  const [versions, setVersions] = useState<PRDVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [selectedVersionData, setSelectedVersionData] = useState<PRDVersion | null>(null)
  const { projectId } = useAppStore()

  useEffect(() => {
    fetch(`/api/versions${projectId ? `?projectId=${projectId}` : ''}`)
      .then(r => r.json())
      .then(data => setVersions(data))
  }, [projectId])

  useEffect(() => {
    if (selectedVersionId) {
      // Fetch version data
      fetch(`/api/versions?id=${selectedVersionId}`)
        .then(r => r.json())
        .then(data => setSelectedVersionData(data))

      // Create or fetch review session
      fetch(`/api/reviews?action=createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: selectedVersionId })
      })
      .then(r => r.json())
      .then(sess => {
        setSession(sess)
        return fetch(`/api/reviews?action=summary&sessionId=${sess.id}`)
      })
      .then(r => r.json())
      .then(sum => setSummary(sum))
    }
  }, [selectedVersionId])

  const handleAction = async (type: 'comment' | 'approve' | 'resolve', data: Record<string, unknown>) => {
    if (!session) return
    const res = await fetch(`/api/reviews?action=${type === 'approve' ? 'setApproval' : type === 'comment' ? 'addComment' : 'resolveComment'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, ...data })
    })
    const updated = await res.json()
    
    // Quick local state update
    if (type === 'approve') {
      setSession(prev => prev ? { ...prev, approvals: [...prev.approvals, updated] } : null)
    } else if (type === 'comment') {
      setSession(prev => prev ? { ...prev, comments: [...prev.comments, updated] } : null)
    } else {
      setSession(prev => prev ? { ...prev, comments: prev.comments.map(c => c.id === updated.id ? updated : c) } : null)
    }

    // Refresh summary
    fetch(`/api/reviews?action=summary&sessionId=${session.id}`)
      .then(r => r.json())
      .then(sum => setSummary(sum))
  }

  const getEntityStatus = (entityId: string): EntityReviewStatus => {
    if (!session) return 'PENDING'
    const approvals = session.approvals.filter(a => a.entityId === entityId)
    if (approvals.length === 0) return 'PENDING'
    return approvals[approvals.length - 1].status
  }

  const getEntityComments = (entityId: string): Comment[] => {
    if (!session) return []
    return session.comments.filter(c => c.entityId === entityId)
  }

  const StatusBadge = ({ status }: { status: EntityReviewStatus }) => {
    if (status === 'APPROVED') return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3"/> APPROVED</span>
    if (status === 'REJECTED') return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3"/> REJECTED</span>
    if (status === 'NEEDS_CHANGES') return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3"/> NEEDS CHANGES</span>
    return <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded text-xs font-bold"><Clock className="w-3 h-3"/> PENDING</span>
  }

  const EntityCard = ({ type, entity }: { type: CollaborationEntityType, entity: Record<string, unknown> }) => {
    const id = (entity.id as string) || 'unknown'
    const title = (entity.title || entity.name || entity.description || 'Untitled') as string
    const description = (entity.description as string) || ''
    const status = getEntityStatus(id)
    const comments = getEntityComments(id)

    const [commentText, setCommentText] = useState('')

    return (
      <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-white shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{type} {id}</div>
            <div className="text-lg font-semibold text-slate-800">{title}</div>
            {description !== title && <div className="text-sm text-slate-600 mt-1">{description}</div>}
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={() => handleAction('approve', { entityType: type, entityId: id, reviewer: 'User', status: 'APPROVED' })} className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-medium transition-colors">Approve</button>
          <button onClick={() => handleAction('approve', { entityType: type, entityId: id, reviewer: 'User', status: 'NEEDS_CHANGES' })} className="px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded text-sm font-medium transition-colors">Needs Changes</button>
          <button onClick={() => handleAction('approve', { entityType: type, entityId: id, reviewer: 'User', status: 'REJECTED' })} className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm font-medium transition-colors">Reject</button>
        </div>

        {comments.length > 0 && (
          <div className="mt-2 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {comments.map(c => (
              <div key={c.id} className="text-sm flex justify-between items-start">
                <div>
                  <span className="font-semibold text-slate-700">{c.author}: </span>
                  <span className={c.resolved ? "text-slate-400 line-through" : "text-slate-600"}>{c.content}</span>
                </div>
                {!c.resolved && (
                  <button onClick={() => handleAction('resolve', { commentId: c.id })} className="text-xs text-blue-600 hover:underline">Resolve</button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Leave a comment..." className="flex-1 border rounded px-3 py-1 text-sm outline-none focus:border-blue-400" />
          <button onClick={() => { if(commentText) { handleAction('comment', { entityType: type, entityId: id, author: 'User', content: commentText }); setCommentText('') } }} className="px-3 py-1 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700"><MessageSquare className="w-4 h-4"/></button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Save className="w-5 h-5"/> Structured Review Mode</h2>
          <p className="text-sm text-slate-500">Collaborate, comment, and approve requirements.</p>
        </div>
        <select value={selectedVersionId} onChange={e => setSelectedVersionId(e.target.value)} className="border p-2 rounded w-64 bg-slate-50">
          <option value="">Select Version to Review</option>
          {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNumber}: {v.title}</option>)}
        </select>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        <div className="col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-4">Review Summary</h3>
          {summary ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-600">Approved</span><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">{summary.approvedCount}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-600">Needs Changes</span><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">{summary.needsChangesCount}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-600">Rejected</span><span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{summary.rejectedCount}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-600">Pending</span><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">{summary.pendingCount}</span></div>
            </div>
          ) : <p className="text-sm text-slate-500">Select a version.</p>}
        </div>

        <div className="col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner overflow-y-auto space-y-6">
          {selectedVersionData ? (
            <>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">Goals</h3>
                {selectedVersionData.structuredPRD.goals?.map(g => <EntityCard key={g.id} type="Goal" entity={g as unknown as Record<string, unknown>} />)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">Functional Requirements</h3>
                {selectedVersionData.structuredPRD.functionalRequirements?.map(r => <EntityCard key={r.id} type="Requirement" entity={r as unknown as Record<string, unknown>} />)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">User Stories</h3>
                {selectedVersionData.structuredPRD.userStories?.map(u => <EntityCard key={u.id} type="UserStory" entity={u as unknown as Record<string, unknown>} />)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">Success Metrics</h3>
                {selectedVersionData.structuredPRD.successMetrics?.map(m => <EntityCard key={m.id} type="Metric" entity={m as unknown as Record<string, unknown>} />)}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">Please select a version to enter structured review mode.</div>
          )}
        </div>
      </div>
    </div>
  )
}
