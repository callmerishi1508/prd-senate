"use client"

import { useEffect, useRef } from "react"
import { useAppStore, DebateMessageData } from "@/store/useAppStore"
import { UserCircle2, AlertTriangle, CheckCircle, XCircle, FileText, Loader2, Info } from "lucide-react"

type CritiqueIssue = {
  assumption?: unknown;
  assumptionFlagged?: unknown;
  issue?: unknown;
  reason?: unknown;
} | string | unknown;

export function DebateRoom() {
  const { setCurrentStep, debateMessages, activeAgent, finalPRDJSON } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [debateMessages, activeAgent])

  const safeRender = (val: unknown) => {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (!val) return '';
    return JSON.stringify(val);
  }

  const renderContent = (msg: DebateMessageData) => {
    const { role, rawData } = msg

    if (!rawData) return <p className="text-sm text-slate-500 italic">Processing...</p>

    if (role === 'pm') {
      return (
        <div className="space-y-3">
          <p className="font-medium text-slate-800">Initial PRD Draft Generated</p>
          <div className="text-sm text-slate-600 bg-slate-100 p-3 rounded">
            <strong>Goals:</strong> {Array.isArray(rawData.goals) ? rawData.goals.length : 0} identified<br/>
            <strong>Features:</strong> {Array.isArray(rawData.features) ? rawData.features.length : 0} proposed
          </div>
        </div>
      )
    }

    if (role === 'ux') {
      const flagged = Array.isArray(rawData.assumptionsFlagged) ? rawData.assumptionsFlagged : []
      const recommendations = Array.isArray(rawData.uxRecommendations) ? rawData.uxRecommendations : []
      
      return (
        <div className="space-y-3">
          {rawData.argument ? <p className="text-sm italic text-slate-700 bg-slate-100 p-3 rounded border-l-4 border-purple-500">"{String(rawData.argument)}"</p> : null}
          <p className="font-medium text-slate-800">UX Review Findings</p>
          {flagged.map((a: CritiqueIssue, i: number) => {
            const obj = typeof a === 'object' && a !== null ? a as Record<string, unknown> : {};
            return (
            <div key={i} className="bg-red-50 text-red-700 p-3 rounded border border-red-200 text-sm flex gap-3">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>Assumption Flagged:</strong> {safeRender(obj.assumption || obj.assumptionFlagged || a)}
                <p className="mt-1 text-red-600">{safeRender(obj.reason)}</p>
              </div>
            </div>
          )})}
          {recommendations.length > 0 && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded border border-blue-200 text-sm">
              <strong>Recommendations:</strong>
              <ul className="list-disc pl-5 mt-1">
                {recommendations.map((r: unknown, i: number) => <li key={i}>{safeRender(r)}</li>)}
              </ul>
            </div>
          )}
        </div>
      )
    }

    if (role === 'tech') {
      const issues = Array.isArray(rawData.feasibilityIssues) ? rawData.feasibilityIssues : []
      const recommendations = Array.isArray(rawData.technicalRecommendations) ? rawData.technicalRecommendations : []
      
      return (
        <div className="space-y-3">
          {rawData.argument ? <p className="text-sm italic text-slate-700 bg-slate-100 p-3 rounded border-l-4 border-yellow-500">"{String(rawData.argument)}"</p> : null}
          <p className="font-medium text-slate-800">Architecture Review Findings</p>
          {issues.map((a: CritiqueIssue, i: number) => {
            const obj = typeof a === 'object' && a !== null ? a as Record<string, unknown> : {};
            return (
            <div key={i} className="bg-yellow-50 text-yellow-700 p-3 rounded border border-yellow-200 text-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>Feasibility Issue:</strong> {safeRender(obj.issue || a)}
                <p className="mt-1 text-yellow-600">{safeRender(obj.reason)}</p>
              </div>
            </div>
          )})}
          {recommendations.length > 0 && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded border border-blue-200 text-sm">
              <strong>Recommendations:</strong>
              <ul className="list-disc pl-5 mt-1">
                {recommendations.map((r: unknown, i: number) => <li key={i}>{safeRender(r)}</li>)}
              </ul>
            </div>
          )}
        </div>
      )
    }

    if (role === 'verification') {
      const edgeCases = Array.isArray(rawData.missingEdgeCases) ? rawData.missingEdgeCases : []
      const untestable = Array.isArray(rawData.untestableRequirements) ? rawData.untestableRequirements : []
      
      return (
        <div className="space-y-3">
          {rawData.argument ? <p className="text-sm italic text-slate-700 bg-slate-100 p-3 rounded border-l-4 border-orange-500">"{String(rawData.argument)}"</p> : null}
          <p className="font-medium text-slate-800">QA & Verification Report</p>
          {(edgeCases.length > 0 || untestable.length > 0) ? (
            <div className="bg-orange-50 text-orange-700 p-3 rounded border border-orange-200 text-sm flex gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>Gaps Identified:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {edgeCases.map((r: unknown, i: number) => <li key={i}>Edge case: {safeRender(r)}</li>)}
                  {untestable.map((r: unknown, i: number) => <li key={i}>Untestable: {safeRender(r)}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 text-green-700 p-3 rounded border border-green-200 text-sm flex gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>No major verification gaps found.</span>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Senate Debate Room</h2>
          <p className="text-sm text-slate-500">
            {activeAgent.status !== 'done' && activeAgent.agent 
              ? `${activeAgent.agent} is ${activeAgent.status}...` 
              : "Consensus reached. PRD generation complete."}
          </p>
        </div>
        {finalPRDJSON && (
          <button 
            onClick={() => setCurrentStep('prd')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium animate-in fade-in zoom-in duration-300"
          >
            <FileText className="w-4 h-4" />
            View Final PRD
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6 pb-8">
          {debateMessages.map((msg, idx) => {
            return (
              <div key={`${msg.id}-${idx}`} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'pm' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                    msg.role === 'pm' ? 'bg-blue-100 text-blue-700' :
                    msg.role === 'ux' ? 'bg-purple-100 text-purple-700' :
                    msg.role === 'verification' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    <UserCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{msg.name}</span>
                  </div>
                  <div className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm">
                    {renderContent(msg)}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Active Agent Typing Indicator */}
          {activeAgent.status !== 'idle' && activeAgent.status !== 'done' && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 shadow-sm flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-20 bg-slate-100 border border-slate-200 rounded-xl"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
