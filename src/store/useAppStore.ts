import { create } from 'zustand'

export type AppStep = 'input' | 'research' | 'debate' | 'prd' | 'review' | 'versions' | 'knowledge' | 'planning' | 'delivery' | 'integrations' | 'export' | 'intelligence'

export interface AgentStatus {
  agent: string
  status: 'idle' | 'thinking' | 'drafting' | 'critiquing' | 'verifying' | 'finalizing' | 'done' | 'error'
}

export interface DebateMessageData {
  id: string
  role: 'pm' | 'ux' | 'tech' | 'verification' | 'consensus'
  name: string
  rawData: Record<string, unknown> | null // The JSON output from the agent
}

interface AppState {
  currentStep: AppStep
  setCurrentStep: (step: AppStep) => void
  projectId: string
  setProjectId: (id: string) => void
  
  // Form State
  problemStatement: string
  targetUsers: string
  constraints: string
  setProblemStatement: (val: string) => void
  setTargetUsers: (val: string) => void
  setConstraints: (val: string) => void

  // AI State
  activeAgent: AgentStatus
  setActiveAgent: (status: AgentStatus) => void
  researchData: Record<string, unknown> | null
  setResearchData: (data: Record<string, unknown> | null) => void
  draftData: Record<string, unknown> | null
  setDraftData: (data: Record<string, unknown> | null) => void
  debateMessages: DebateMessageData[]
  addDebateMessage: (msg: DebateMessageData) => void
  verificationData: Record<string, unknown> | null
  setVerificationData: (data: Record<string, unknown> | null) => void
  finalPRDJSON: Record<string, unknown> | null
  setFinalPRDJSON: (data: Record<string, unknown> | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentStep: 'input',
  setCurrentStep: (step) => set({ currentStep: step }),
  projectId: '',
  setProjectId: (id) => set({ projectId: id }),

  problemStatement: '',
  targetUsers: '',
  constraints: '',
  setProblemStatement: (val) => set({ problemStatement: val }),
  setTargetUsers: (val) => set({ targetUsers: val }),
  setConstraints: (val) => set({ constraints: val }),

  activeAgent: { agent: '', status: 'idle' },
  setActiveAgent: (status) => set({ activeAgent: status }),
  
  researchData: null,
  setResearchData: (data) => set({ researchData: data }),
  
  draftData: null,
  setDraftData: (data) => set({ draftData: data }),

  debateMessages: [],
  addDebateMessage: (msg) => set((state) => ({ debateMessages: [...state.debateMessages, msg] })),
  
  verificationData: null,
  setVerificationData: (data) => set({ verificationData: data }),
  
  finalPRDJSON: null,
  setFinalPRDJSON: (data) => set({ finalPRDJSON: data }),
}))
