'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import '../architecture.css'

export default function ArchitecturePage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  // Animate through the flow
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4) // 4 steps: start, excel, filter, analyzer
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="architecture-page">
      {/* Header */}
      <header className="arch-header">
        <button className="back-btn" onClick={() => router.push('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to App
        </button>
        <div className="arch-title-section">
          <div className="accenture-logo-arch">
            <div className="accent-symbol">{'>'}</div>
            <div className="company-name">Accenture</div>
          </div>
          <h1>LangGraph Multi-Agent Architecture</h1>
          <p className="subtitle">Real-time AI-powered opportunity analysis workflow</p>
        </div>
      </header>

      {/* Architecture Diagram */}
      <div className="architecture-container">
        
        {/* Start Node */}
        <div className={`flow-node start-node ${activeStep === 0 ? 'active' : ''}`}>
          <div className="node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>START</h3>
          <p>User uploads Excel file with opportunities</p>
        </div>

        {/* Arrow 1 */}
        <div className={`flow-arrow ${activeStep >= 1 ? 'active' : ''}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--accenture-purple)" />
              </marker>
            </defs>
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--accenture-purple)" strokeWidth="3" markerEnd="url(#arrowhead)" className="arrow-line"/>
          </svg>
          <span className="data-label">Excel File Buffer</span>
        </div>

        {/* Excel Reader Agent */}
        <div className={`flow-node agent-node ${activeStep === 1 ? 'active' : ''}`}>
          <div className="agent-badge orchestrator">Tool</div>
          <div className="node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Excel Reader Agent</h3>
          <p className="agent-desc">
            <strong>LLM:</strong> ChatOpenAI (GPT-4o-mini)<br/>
            <strong>Purpose:</strong> Parses Excel file and extracts opportunity data<br/>
            <strong>Tool:</strong> parseExcelFile()<br/>
            <strong>Output:</strong> Raw opportunity records with all columns
          </p>
          <div className="agent-stats">
            <span>🧠 Reasoning-based parsing</span>
            <span>📊 Validates data structure</span>
          </div>
        </div>

        {/* Arrow 2 */}
        <div className={`flow-arrow ${activeStep >= 2 ? 'active' : ''}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--accenture-purple)" strokeWidth="3" markerEnd="url(#arrowhead)" className="arrow-line"/>
          </svg>
          <span className="data-label">Raw Data (150 rows)</span>
        </div>

        {/* Filter Agent */}
        <div className={`flow-node agent-node ${activeStep === 2 ? 'active' : ''}`}>
          <div className="agent-badge orchestrator">Tool</div>
          <div className="node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Filter Agent</h3>
          <p className="agent-desc">
            <strong>LLM:</strong> ChatOpenAI (GPT-4o-mini)<br/>
            <strong>Purpose:</strong> Identifies US-Comms & Media opportunities<br/>
            <strong>Tool:</strong> filterCommsMedia()<br/>
            <strong>Filter:</strong> Client Group = "US-Comms & Media"<br/>
            <strong>Output:</strong> Filtered opportunity list
          </p>
          <div className="agent-stats">
            <span>🎯 Intelligent filtering</span>
            <span>📈 Reports statistics</span>
          </div>
        </div>

        {/* Arrow 3 */}
        <div className={`flow-arrow ${activeStep >= 3 ? 'active' : ''}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--accenture-purple)" strokeWidth="3" markerEnd="url(#arrowhead)" className="arrow-line"/>
          </svg>
          <span className="data-label">Filtered Opportunities (47)</span>
        </div>

        {/* Analyzer Agent */}
        <div className={`flow-node agent-node analyzer ${activeStep === 3 ? 'active' : ''}`}>
          <div className="agent-badge agent">AI Agent</div>
          <div className="node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Analyzer Agent</h3>
          <p className="agent-desc">
            <strong>LLM:</strong> ChatOpenAI (GPT-4o-mini)<br/>
            <strong>Purpose:</strong> AI-powered opportunity tagging<br/>
            <strong>Categories:</strong> AI, Analytics, Data<br/>
            <strong>Processing:</strong> Sequential (one by one)<br/>
            <strong>Output:</strong> Tagged opportunities with rationale & confidence
          </p>
          <div className="agent-stats">
            <span>🤖 Advanced AI analysis</span>
            <span>💡 Detailed reasoning</span>
            <span>📊 Confidence scores</span>
          </div>
        </div>

        {/* Arrow 4 */}
        <div className={`flow-arrow ${activeStep >= 3 ? 'active' : ''}`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="var(--accenture-purple)" strokeWidth="3" markerEnd="url(#arrowhead)" className="arrow-line"/>
          </svg>
          <span className="data-label">Tagged Opportunities</span>
        </div>

        {/* End Node */}
        <div className={`flow-node end-node ${activeStep === 3 ? 'active' : ''}`}>
          <div className="node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>COMPLETE</h3>
          <p>Results ready for Excel export</p>
        </div>

      </div>

      {/* Technical Details */}
      <div className="tech-details">
        <h2>Technical Architecture</h2>
        
        <div className="tech-grid">
          <div className="tech-card">
            <h3>🔧 Framework</h3>
            <ul>
              <li><strong>LangGraph 1.0:</strong> State management & workflow orchestration</li>
              <li><strong>LangChain Core 1.0:</strong> Agent framework & message passing</li>
              <li><strong>OpenAI GPT-4o-mini:</strong> LLM reasoning for all agents</li>
            </ul>
          </div>

          <div className="tech-card">
            <h3>💬 Agent Communication</h3>
            <ul>
              <li><strong>BaseMessage[]:</strong> Inter-agent message passing</li>
              <li><strong>HumanMessage:</strong> Instructions to agents</li>
              <li><strong>AIMessage:</strong> Agent responses with reasoning</li>
              <li><strong>State Updates:</strong> Real-time progress streaming</li>
            </ul>
          </div>

          <div className="tech-card">
            <h3>🎯 Workflow Features</h3>
            <ul>
              <li><strong>Conditional Routing:</strong> Stops if no data found</li>
              <li><strong>Sequential Processing:</strong> One opportunity at a time</li>
              <li><strong>Error Handling:</strong> Graceful failures with context</li>
              <li><strong>Progress Tracking:</strong> Real-time updates to UI</li>
            </ul>
          </div>

          <div className="tech-card">
            <h3>📊 Data Flow</h3>
            <ul>
              <li><strong>Input:</strong> Excel file (XLSX format)</li>
              <li><strong>Stage 1:</strong> 150 rows extracted</li>
              <li><strong>Stage 2:</strong> 47 Comms & Media opportunities</li>
              <li><strong>Stage 3:</strong> 32 tagged (AI: 15, Analytics: 12, Data: 18)</li>
              <li><strong>Output:</strong> Tagged Excel with rationale</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Agent Types Legend */}
      <div className="legend-section">
        <h3>Agent Types</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="agent-badge orchestrator">Tool</span>
            <p>Deterministic processing tools (Excel parsing, filtering)</p>
          </div>
          <div className="legend-item">
            <span className="agent-badge agent">AI Agent</span>
            <p>LLM-powered agents with reasoning capabilities</p>
          </div>
        </div>
      </div>

    </div>
  )
}

