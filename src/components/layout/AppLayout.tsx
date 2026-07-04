"use client"

import React from 'react'
import { useAppStore, AppStep } from '@/store/useAppStore'
import { FileText, Users, Search, Download, Edit3, MessageSquare, History, CheckSquare, BrainCircuit, Layout, Truck, Link } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps: { id: AppStep; label: string; icon: React.ElementType }[] = [
  { id: 'input', label: 'Input', icon: Edit3 },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'debate', label: 'Debate', icon: MessageSquare },
  { id: 'prd', label: 'Final PRD', icon: FileText },
  { id: 'review', label: 'Review', icon: CheckSquare },
  { id: 'versions', label: 'Versions', icon: History },
  { id: 'knowledge', label: 'Knowledge Base', icon: BrainCircuit },
  { id: 'planning', label: 'Planning', icon: Layout },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'intelligence', label: 'Intelligence', icon: BrainCircuit },
  { id: 'export', label: 'Export', icon: Download },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentStep, setCurrentStep } = useAppStore()

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm z-10">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-lg">
          <Users className="h-6 w-6 text-blue-700" />
          <span>SpecCouncil</span>
        </div>
        
        {currentStep && steps.findIndex(s => s.id === currentStep) !== -1 && (
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}: {steps.find(s => s.id === currentStep)?.label}</span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }} 
              />
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
          <nav className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const Icon = step.icon
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-700" : "text-slate-400")} />
                  {step.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 shadow-inner">
          <div className="mx-auto max-w-5xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
