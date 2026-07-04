import { ResearchTemplate } from '../research-schema';

export const noteTakingTemplate: ResearchTemplate = {
  category: "Note Taking",
  keywords: ["note", "knowledge base", "writing", "markdown", "journal", "document", "wiki", "zettelkasten"],
  competitors: [
    { name: "Notion", category: "All-in-one Workspace", strengths: ["Highly customizable databases", "Collaboration"], weaknesses: ["Steep learning curve", "Offline mode is weak"] },
    { name: "Obsidian", category: "Local Knowledge Graph", strengths: ["Local-first privacy", "Extensive plugins", "Graph view"], weaknesses: ["Syncing is a paid add-on", "Mobile app limitations"] },
    { name: "Evernote", category: "Legacy Note App", strengths: ["Web clipper", "OCR capabilities"], weaknesses: ["Bloated features", "High subscription cost"] }
  ],
  commonFeatures: ["Rich Text / Markdown Editing", "Folders & Tags", "Cross-device Sync", "Search", "Export Options"],
  marketStandards: [
    { category: "Portability", expectation: "Ability to export data to standard formats (Markdown, PDF)." },
    { category: "Performance", expectation: "Fast app loading and lag-free typing." },
    { category: "Availability", expectation: "Offline access and editing capabilities." }
  ],
  opportunities: [
    { title: "AI Integration", description: "Auto-summarization and intelligent cross-linking of notes." },
    { title: "Seamless Capture", description: "Frictionless capture from web, mobile, and voice inputs." }
  ],
  risks: [
    { title: "Data Lock-in Fears", description: "Users are hesitant to adopt if exporting is difficult." },
    { title: "Feature Bloat", description: "Adding too many features can degrade the core writing experience." }
  ]
};
