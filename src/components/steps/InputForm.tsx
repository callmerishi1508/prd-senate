"use client"

import { useAppStore } from "@/store/useAppStore"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function InputForm() {
  const { 
    problemStatement, 
    setProblemStatement, 
    targetUsers, 
    setTargetUsers, 
    constraints, 
    setConstraints,
    setCurrentStep,
    setActiveAgent,
    setResearchData,
    setDraftData,
    setVerificationData,
    setFinalPRDJSON,
    setProjectId,
    addDebateMessage
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(false)

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCurrentStep('research')
    
    const newProjectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setProjectId(newProjectId)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement,
          targetUsers,
          constraints,
          model: 'qwen2.5:1.5b'
        })
      })

      if (!response.body) throw new Error("No response stream")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const events = chunk.split('\n\n').filter(Boolean)

          for (const ev of events) {
            const lines = ev.split('\n')
            const eventType = lines.find(l => l.startsWith('event: '))?.replace('event: ', '')
            const dataLine = lines.find(l => l.startsWith('data: '))?.replace('data: ', '')
            
            if (eventType && dataLine) {
              const data = JSON.parse(dataLine)
              
              if (eventType === 'agent-status') {
                setActiveAgent(data)
                if (data.agent === 'Product Strategist') setCurrentStep('debate')
                if (data.agent === 'Consensus Agent') setCurrentStep('debate')
              }
              if (eventType === 'research-complete') setResearchData(data.data)
              if (eventType === 'draft-complete') {
                setDraftData(data.data)
                setCurrentStep('debate')
                addDebateMessage({ id: 'draft', role: 'pm', name: 'Product Strategist', rawData: data.data })
              }
              if (eventType === 'debate-message') {
                addDebateMessage({ id: Date.now().toString(), role: data.role, name: data.name, rawData: data.data })
              }
              if (eventType === 'verification-complete') {
                setVerificationData(data.data)
                addDebateMessage({ id: 'verify', role: 'verification', name: 'Verification Agent', rawData: data.data })
              }
              if (eventType === 'final-prd') {
                setFinalPRDJSON(data.data)
                setCurrentStep('prd')
              }
              if (eventType === 'validation-failed') {
                alert(`PRD Validation Failed.\nReasons:\n- ${data.reasons.join('\n- ')}\n\nPlease refine your input or try again.`)
                setCurrentStep('input')
              }
              if (eventType === 'done') {
                setIsLoading(false)
              }
              if (eventType === 'error') {
                console.error("Pipeline Error:", data.message)
                setIsLoading(false)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-blue-900 px-6 py-8 text-white text-center">
        <h1 className="text-2xl font-bold mb-2">SpecCouncil</h1>
        <p className="text-blue-200">AI Product Requirement Studio</p>
      </div>
      
      <form onSubmit={handleStartAnalysis} className="p-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="problem" className="block text-sm font-medium text-slate-700">
            Problem Statement
          </label>
          <textarea
            id="problem"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y"
            placeholder="What problem are we solving? e.g., Users need a way to track their daily water intake."
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="users" className="block text-sm font-medium text-slate-700">
              Target Users
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep('versions')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                View Versions
              </button>
              <button
                onClick={() => setCurrentStep('knowledge')}
                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Knowledge Base
              </button>
            </div>
          </div>
          <input
            id="users"
            type="text"
            value={targetUsers}
            onChange={(e) => setTargetUsers(e.target.value)}
            className="w-full p-3 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g., Health-conscious millennials"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="constraints" className="block text-sm font-medium text-slate-700">
            Constraints
          </label>
          <textarea
            id="constraints"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            className="w-full min-h-[80px] p-3 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y"
            placeholder="Any technical or business constraints? e.g., Must use React Native, launch by Q3."
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-70"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLoading ? "Starting Senate Pipeline..." : "Start Analysis"}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">What happens next?</h3>
          <ul className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> AI Research</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> Multi-Agent Debate</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> PRD Generation</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> Review Workflow</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> Roadmap Planning</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> Sprint Planning</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</div> Engineering Sync</li>
          </ul>
        </div>
      </form>
    </div>
  )
}
