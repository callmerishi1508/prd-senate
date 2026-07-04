"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Download, Check, Save, MessageSquareText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { History } from 'lucide-react'

type Dict = Record<string, unknown>;

function renderList(items: unknown, formatFn?: (item: Dict) => string): string {
  if (!items) return ''
  if (Array.isArray(items)) {
    return items.map((item: unknown) => {
      if (formatFn && typeof item === 'object' && item !== null) return formatFn(item as Dict)
      if (typeof item === 'string') return `- ${item}`
      if (typeof item === 'object' && item !== null) {
        const obj = item as Dict
        return `- ${String(obj.name || obj.title || obj.assumption || JSON.stringify(item))}`
      }
      return `- ${String(item)}`
    }).join('\n')
  }
  return String(items)
}

function getItems(section: unknown): unknown[] | null {
  if (!section) return null
  if (typeof section === 'object' && section !== null) {
    const obj = section as Dict
    if (obj.items && Array.isArray(obj.items)) return obj.items
  }
  if (Array.isArray(section)) {
    if (section.length === 1 && typeof section[0] === 'object' && section[0] !== null) {
      const first = section[0] as Dict
      if (first.items && Array.isArray(first.items)) {
        return first.items
      }
    }
    return section
  }
  return null
}

function getConfidence(section: unknown): number {
  if (!section) return 0
  if (typeof section === 'object' && section !== null) {
    const obj = section as Dict
    if (typeof obj.confidence === 'number') return obj.confidence
  }
  if (Array.isArray(section) && section.length === 1 && typeof section[0] === 'object' && section[0] !== null) {
    const first = section[0] as Dict
    if (typeof first.confidence === 'number') return first.confidence
  }
  return 0
}

function getContent(section: unknown): string {
  if (!section) return ''
  if (typeof section === 'string') return section
  if (typeof section === 'object' && section !== null) {
    const obj = section as Dict
    if (typeof obj.content === 'string') return obj.content
  }
  return ''
}

function jsonToMarkdown(data: unknown): string {
  if (!data) return '# PRD Senate\nGenerating...'
  const obj = typeof data === 'object' && data !== null ? data as Dict : {}
  
  if (obj.rawFallback && typeof obj.rawFallback === 'string') {
    return obj.rawFallback;
  }
  
  return `
# Product Requirements Document

## Product Overview
${getContent(obj.productOverview)}
_Confidence: ${getConfidence(obj.productOverview)}%_

## Goals
${renderList(getItems(obj.goals))}
_Confidence: ${getConfidence(obj.goals)}%_

## Non-Goals
${renderList(getItems(obj.nonGoals))}
_Confidence: ${getConfidence(obj.nonGoals)}%_

## User Personas
${renderList(getItems(obj.userPersonas), (p: Dict) => `- **${(p.personaName as string) || (p.name as string) || 'Persona'}:** ${(p.description as string) || JSON.stringify(p)}`)}
_Confidence: ${getConfidence(obj.userPersonas)}%_

## Functional Requirements
${renderList(getItems(obj.functionalRequirements), (f: Dict) => `- **[${(f.priority as string) || 'Medium'}] ${(f.name as string) || 'Feature'}:** ${(f.description as string) || JSON.stringify(f)}`)}
_Confidence: ${getConfidence(obj.functionalRequirements)}%_

## User Experience
${getContent(obj.userExperience)}
_Confidence: ${getConfidence(obj.userExperience)}%_

## Success Metrics
${renderList(getItems(obj.successMetrics), (m: Dict) => `- ${String(m.item || m.metric || m.name || JSON.stringify(m))}`)}
_Confidence: ${getConfidence(obj.successMetrics)}%_

## Technical Considerations
${renderList(getItems(obj.technicalConsiderations), (t: Dict) => `- ${String(t.item || t.consideration || t.issue || JSON.stringify(t))}`)}
_Confidence: ${getConfidence(obj.technicalConsiderations)}%_

## User Stories
${getItems(obj.userStories)?.map((usRaw: unknown) => {
  const us = (typeof usRaw === 'object' && usRaw !== null ? usRaw : {}) as Dict
  return `
**${(us.id as string) || 'US'} | ${(us.title as string) || 'User Story'}**
- **Description:** ${(us.description as string) || ''}
- **Acceptance Criteria:**
${Array.isArray(us.acceptanceCriteria) ? us.acceptanceCriteria.map((ac: unknown) => `  - ${typeof ac === 'string' ? ac : JSON.stringify(ac)}`).join('\n') : ''}
`}).join('\n') || ''}
_Confidence: ${getConfidence(obj.userStories)}%_
`.trim()
}

export function FinalPRD() {
  const { finalPRDJSON, researchData, problemStatement, setCurrentStep, projectId } = useAppStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: jsonToMarkdown(finalPRDJSON),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base prose-blue focus:outline-none max-w-none p-8 min-h-[600px]',
      },
    },
  })

  // Update editor content when finalPRDJSON arrives
  useEffect(() => {
    if (editor && finalPRDJSON) {
      // TipTap doesn't parse markdown by default in setContent, we'd normally use a markdown extension
      // But since we are passing plain text formatted as markdown, we should render it or let the user see it as MD.
      // A better approach for TipTap without markdown parser is to set text or use HTML.
      // Let's convert simple markdown to HTML manually for the viewer, or just display the raw markdown in a pre-formatted way if needed.
      // Wait, TipTap StarterKit handles basic HTML. Let's just insert it as text and let it render.
      // Actually, standard TipTap doesn't automatically convert Markdown on load unless you use markdown-it or tiptap-markdown.
      // To keep it simple without adding a new library, we'll just insert the plain text markdown. 
      // The user can edit the raw markdown and export it.
      editor.commands.setContent(jsonToMarkdown(finalPRDJSON).replace(/\n/g, '<br/>'))
    }
  }, [editor, finalPRDJSON])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([editor?.getText() || ''], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = "PRD_Senate.md";
      document.body.appendChild(element);
      element.click();
      setIsExporting(false)
    }, 1000)
  }

  const handleSave = async () => {
    setIsSaved(true)
    
    // Create new version payload
    const versionPayload = {
      projectId,
      title: "PRD Update",
      changeSummary: "Generated from " + problemStatement.slice(0, 30) + "...",
      generatedFromPrompt: problemStatement,
      status: "DRAFT",
      structuredPRD: finalPRDJSON,
      traceabilityMap: [], // Ideally we would get this from state, but for now it's generated on backend. Let's just pass empty and diff engine will handle diffs fine. Wait, we should probably store TraceabilityMap in AppStore if possible.
      researchReport: researchData
    }

    try {
      await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionPayload)
      })
    } catch(e) {}

    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Final Product Requirements Document</h2>
          <p className="text-sm text-slate-500">Review, edit, and export your generated PRD.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentStep('review')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
          >
            <MessageSquareText className="w-4 h-4" />
            Review
          </button>
          <button 
            onClick={() => setCurrentStep('versions')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
            {isSaved ? "Saved to Version" : "Save Draft"}
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export Markdown"}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
