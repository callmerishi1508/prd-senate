# PRD Senate

PRD Senate is an advanced, AI-powered multi-agent pipeline for autonomous Product Requirements Document (PRD) generation, critique, consensus-building, and validation. The system acts as a virtual "senate" of specialized AI agents (Product Manager, UX Researcher, Technical Architect, and Quality Validator) that collaboratively research, debate, and assemble highly structured PRDs from initial problem statements.

## Key Features

- **Multi-Agent Debating System**: Agents review drafts from distinct perspectives (UX vs. Technical) to ensure comprehensive PRDs.
- **Hierarchical Consensus (Stages D1-D4)**: Breaks down the PRD generation into Overview, Goals & Metrics, UX & User Stories, and Tech & Personas, processing them sequentially to guarantee schema integrity and high detail.
- **Self-Healing AI**: Embedded schemas and a dedicated Repair Agent automatically catch LLM hallucinations or JSON schema violations and correct them in real-time.
- **Built-in Research Engine**: Dynamically retrieves market research, competitor analysis, and context to ground the PRDs in reality.
- **Robust Telemetry & Benchmarking**: Ships with an extensive benchmark suite (`compatibility-10`) to test AI generation stability, latency, validation pass rates, and schema integrity across models like `qwen2.5:1.5b`, `qwen2.5-coder:7b`, and `llama3.1:8b`.
- **Next.js & React**: Modern front-end framework integrating with local LLMs (Ollama) via streaming API routes.

## Architecture

1. **Research Engine**: Synthesizes the user's problem statement into a comprehensive market research report.
2. **Drafting Agent (Lead PM)**: Creates the initial PRD skeleton based on research.
3. **Critique Panel (UX & Tech)**: Parallel agents critique the draft from user-centric and architecture-centric perspectives.
4. **Hierarchical Assembly**: A Coordinator agent synthesizes the research and critiques, and generates a structured PRD across 4 discrete stages.
5. **Quality Validator**: A rigorous verification layer that checks JSON schema structures.
6. **Repair Agent**: Automatically fixes validation issues.

## Tech Stack

- **Framework**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Ollama (Local LLM Inference)
- **Validation**: Zod (Schema parsing and strict type-checking)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Ollama installed locally with the required models (e.g., `qwen2.5:1.5b`, `qwen2.5-coder:7b`, `llama3.1:8b`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/callmerishi1508/prd-senate.git
   cd prd-senate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and run the Next.js server:
   ```bash
   npm run build
   npm run start
   ```
   Or run in development mode:
   ```bash
   npm run dev
   ```

### Running Benchmarks
The project includes a robust validation runner to benchmark the multi-agent pipeline against different LLMs.
```bash
npx tsx scripts/validation-runner.ts --suite=compatibility-10
```

## Contributing
Contributions are welcome. Please ensure that all new pipeline stages are covered by the validation gates and the benchmark runner.
