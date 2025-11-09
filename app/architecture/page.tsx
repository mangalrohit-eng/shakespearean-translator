'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import '../architecture.css'

export default function ArchitecturePage() {
  const router = useRouter()
  const [flowStep, setFlowStep] = useState(0)

  // Animate data packets flowing through the system
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="architecture-page">
      {/* Compact Header */}
      <header className="arch-header-compact">
        <button className="back-btn-compact" onClick={() => router.push('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h1>LangGraph Multi-Agent Architecture</h1>
        <p className="subtitle-compact">Real-time AI workflow with agent communication</p>
      </header>

      {/* Main Architecture - Above the Fold */}
      <div className="architecture-flow">
        
        {/* START Node */}
        <div className="agent-node-compact start">
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>START</span>
          </div>
          <div className="agent-tooltip">
            <h4>Workflow Initiation</h4>
            <p>User uploads Excel file with business opportunities</p>
          </div>
        </div>

        {/* Flow Arrow 1 */}
        <div className="flow-connector">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--accenture-purple)" />
              </marker>
            </defs>
            <path d="M 0 40 L 200 40" stroke="var(--accenture-purple)" strokeWidth="3" fill="none" markerEnd="url(#arrow)"/>
          </svg>
          {flowStep >= 1 && (
            <div className="data-packet" style={{animation: 'flowPacket 2s ease-in-out'}}>
              📄 File
            </div>
          )}
        </div>

        {/* Orchestrator Agent */}
        <div className="agent-node-compact orchestrator">
          <div className="agent-badge-compact orchestrator-badge">ORCHESTRATOR</div>
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Orchestrator</span>
          </div>
          <div className="agent-tooltip">
            <h4>OrchestratorAgent</h4>
            <p><strong>LLM:</strong> GPT-4o-mini</p>
            <p><strong>Role:</strong> Intelligent workflow coordination</p>
            <p><strong>Responsibilities:</strong></p>
            <ul style={{paddingLeft: '20px', margin: '8px 0', fontSize: '0.85rem'}}>
              <li>Makes routing decisions using AI</li>
              <li>Reviews output from each agent</li>
              <li>Decides if workflow should continue</li>
              <li>Manages inter-agent communication</li>
            </ul>
            <p><strong>Frequency:</strong> Runs after each agent (4 times total)</p>
          </div>
        </div>

        {/* Flow Arrow 2 */}
        <div className="flow-connector">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            <path d="M 0 40 L 200 40" stroke="var(--accenture-purple)" strokeWidth="3" fill="none" markerEnd="url(#arrow)"/>
          </svg>
          {flowStep >= 1 && (
            <div className="data-packet" style={{animation: 'flowPacket 2s ease-in-out'}}>
              📋 Task
            </div>
          )}
        </div>

        {/* Excel Reader Agent */}
        <div className="agent-node-compact tool">
          <div className="agent-badge-compact">TOOL</div>
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" strokeWidth="2"/>
            </svg>
            <span>Excel Reader</span>
          </div>
          <div className="agent-tooltip">
            <h4>Excel Reader Agent</h4>
            <p><strong>LLM:</strong> GPT-4o-mini</p>
            <p><strong>Tool:</strong> parseExcelFile()</p>
            <p><strong>Role:</strong> Parses uploaded Excel and extracts all opportunity records</p>
            <p><strong>Output:</strong> Raw data (150 rows)</p>
          </div>
        </div>

        {/* Flow Arrow 2 */}
        <div className="flow-connector">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            <path d="M 0 40 L 200 40" stroke="var(--accenture-purple)" strokeWidth="3" fill="none" markerEnd="url(#arrow)"/>
          </svg>
          {flowStep >= 2 && (
            <div className="data-packet" style={{animation: 'flowPacket 2s ease-in-out'}}>
              📊 150 rows
            </div>
          )}
        </div>

        {/* Filter Agent */}
        <div className="agent-node-compact tool">
          <div className="agent-badge-compact">TOOL</div>
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeWidth="2"/>
            </svg>
            <span>Filter</span>
          </div>
          <div className="agent-tooltip">
            <h4>Filter Agent</h4>
            <p><strong>LLM:</strong> GPT-4o-mini</p>
            <p><strong>Tool:</strong> filterCommsMedia()</p>
            <p><strong>Role:</strong> Identifies US-Comms & Media opportunities</p>
            <p><strong>Criteria:</strong> Client Group = "US-Comms & Media"</p>
            <p><strong>Output:</strong> Filtered data (47 opportunities)</p>
          </div>
        </div>

        {/* Flow Arrow 3 */}
        <div className="flow-connector">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            <path d="M 0 40 L 200 40" stroke="var(--accenture-purple)" strokeWidth="3" fill="none" markerEnd="url(#arrow)"/>
          </svg>
          {flowStep >= 3 && (
            <div className="data-packet" style={{animation: 'flowPacket 2s ease-in-out'}}>
              🎯 47 opps
            </div>
          )}
        </div>

        {/* Analyzer Agent */}
        <div className="agent-node-compact ai-agent">
          <div className="agent-badge-compact ai">AI AGENT</div>
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2"/>
            </svg>
            <span>Analyzer</span>
          </div>
          <div className="agent-tooltip">
            <h4>Analyzer Agent</h4>
            <p><strong>LLM:</strong> GPT-4o-mini (Main AI)</p>
            <p><strong>Role:</strong> AI-powered opportunity tagging</p>
            <p><strong>Tags:</strong> AI, Analytics, Data</p>
            <p><strong>Processing:</strong> Sequential analysis</p>
            <p><strong>Output:</strong> Tagged opportunities with rationale & confidence scores</p>
          </div>
        </div>

        {/* Flow Arrow 4 */}
        <div className="flow-connector">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            <path d="M 0 40 L 200 40" stroke="var(--accenture-purple)" strokeWidth="3" fill="none" markerEnd="url(#arrow)"/>
          </svg>
          {flowStep >= 0 && (
            <div className="data-packet" style={{animation: 'flowPacket 2s ease-in-out'}}>
              ✅ Tagged
            </div>
          )}
        </div>

        {/* END Node */}
        <div className="agent-node-compact end">
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
            </svg>
            <span>COMPLETE</span>
          </div>
          <div className="agent-tooltip">
            <h4>Workflow Complete</h4>
            <p>Results ready for Excel export with full analysis</p>
          </div>
        </div>

      </div>

      {/* Quick Stats Below */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <h3>Framework</h3>
          <p>LangGraph 1.0 + LangChain Core</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <h3>AI Model</h3>
          <p>OpenAI GPT-4o-mini</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <h3>Communication</h3>
          <p>BaseMessage[] (HumanMessage, AIMessage)</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <h3>Processing</h3>
          <p>Sequential with conditional routing</p>
        </div>
      </div>

      {/* Technical Details - Expandable */}
      <details className="tech-details-expandable">
        <summary>📋 View Technical Details</summary>
        <div className="tech-content">
          <div className="tech-section">
            <h3>Real Agent Architecture</h3>
            <ul>
              <li><strong>4 LLM-Powered Agents:</strong> OrchestratorAgent, ExcelReaderAgent, FilterAgent, AnalyzerAgent</li>
              <li><strong>OrchestratorAgent:</strong> Makes intelligent routing decisions using GPT-4o-mini</li>
              <li><strong>Each agent uses ChatOpenAI:</strong> All powered by GPT-4o-mini</li>
              <li><strong>Agent Communication:</strong> Via BaseMessage[] (HumanMessage, AIMessage)</li>
              <li><strong>Workflow Steps:</strong> 7 total (Orchestrator runs 4 times between other agents)</li>
              <li><strong>Orchestrator:</strong> Reviews outputs, decides routing, manages communication</li>
              <li><strong>Agents:</strong> Execute specialized tasks and report back to Orchestrator</li>
            </ul>
          </div>
          <div className="tech-section">
            <h3>Key Features</h3>
            <ul>
              <li><strong>Conditional Routing:</strong> Workflow stops if no data/opportunities found</li>
              <li><strong>LLM Reasoning:</strong> Each agent uses ChatOpenAI for decision-making</li>
              <li><strong>State Management:</strong> Shared WorkflowState across all agents</li>
              <li><strong>Real-time Streaming:</strong> Progress updates via Server-Sent Events</li>
            </ul>
          </div>
        </div>
      </details>

    </div>
  )
}
