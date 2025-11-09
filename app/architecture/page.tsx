'use client'

import { useState } from 'react'
import Link from 'next/link'
import '../architecture.css'

export default function ArchitecturePage() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div className="architecture-page-new">
      {/* Header */}
      <div className="arch-header-new">
        <Link href="/" className="back-btn-new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Tool
        </Link>
        <h1>Multi-Agent Architecture</h1>
        <p className="subtitle-new">LangGraph-powered workflow with GPT-4o-mini agents</p>
      </div>

      {/* Main Content */}
      <div className="arch-content-new">
        
        {/* Workflow Title */}
        <div className="workflow-title">
          <h2>AI Agent Workflow</h2>
          <p>Click on any step to see details • Arrows show data flow direction</p>
        </div>

        {/* Workflow Diagram */}
        <div className="workflow-container">
          
          {/* Step 1: START */}
          <div className={`workflow-step start-step ${activeStep === 0 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 0 ? null : 0)}>
            <div className="step-icon start-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 0a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100 4 2 2 0 000-4z" strokeWidth="2"/>
                <path d="M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3m0 10v3a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>START</h3>
              <p>Upload Excel File</p>
            </div>
            {activeStep === 0 && (
              <div className="step-details">
                <strong>Input:</strong> Excel file with opportunity data<br/>
                <strong>Format:</strong> Columns include Opportunity Name, Description, D&AI Captain, etc.
              </div>
            )}
          </div>

          {/* Arrow Down */}
          <div className="arrow-down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label">Excel Data</span>
          </div>

          {/* Step 2: Orchestrator (Initial) */}
          <div className={`workflow-step orchestrator-step ${activeStep === 1 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 1 ? null : 1)}>
            <div className="step-icon orchestrator-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Orchestrator Agent</h3>
              <p>Plans and coordinates workflow</p>
              <span className="agent-badge">LLM: GPT-4o-mini</span>
            </div>
            {activeStep === 1 && (
              <div className="step-details">
                <strong>Role:</strong> Central coordinator for all agents<br/>
                <strong>Input:</strong> Raw Excel data<br/>
                <strong>Tasks:</strong> Validates data, creates execution plan, routes to Filter Agent<br/>
                <strong>Temperature:</strong> 0.3 (Focused, deterministic)
              </div>
            )}
          </div>

          {/* Arrow Down with bidirectional indicator */}
          <div className="arrow-bidirectional">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label">Task: Filter Data</span>
          </div>

          {/* Step 3: Filter Agent */}
          <div className={`workflow-step ai-agent-step ${activeStep === 2 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 2 ? null : 2)}>
            <div className="step-icon ai-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M7 12h10M5 18h14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Filter Agent</h3>
              <p>Filters US Comms & Media opportunities</p>
              <span className="agent-badge ai-badge">AI AGENT</span>
            </div>
            {activeStep === 2 && (
              <div className="step-details">
                <strong>Role:</strong> Data filtering specialist<br/>
                <strong>Criteria:</strong> Country = United States, Industry Group = Communications & Media<br/>
                <strong>Output:</strong> Filtered dataset of relevant opportunities<br/>
                <strong>Returns to:</strong> Orchestrator with filtered results
              </div>
            )}
          </div>

          {/* Arrow Up (return) */}
          <div className="arrow-return">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label return-label">Filtered Data (50 rows)</span>
          </div>

          {/* Step 4: Orchestrator (Review) */}
          <div className={`workflow-step orchestrator-step ${activeStep === 3 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 3 ? null : 3)}>
            <div className="step-icon orchestrator-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Orchestrator Agent</h3>
              <p>Reviews filter results, routes to analyzer</p>
            </div>
            {activeStep === 3 && (
              <div className="step-details">
                <strong>Action:</strong> Validates filtered data quality<br/>
                <strong>Next Step:</strong> Routes data to Analyzer Agent for tagging
              </div>
            )}
          </div>

          {/* Arrow Down */}
          <div className="arrow-bidirectional">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label">Task: Analyze & Tag</span>
          </div>

          {/* Step 5: Analyzer Agent */}
          <div className={`workflow-step ai-agent-step ${activeStep === 4 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 4 ? null : 4)}>
            <div className="step-icon ai-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Analyzer Agent</h3>
              <p>AI/Analytics/Data tagging with confidence scores</p>
              <span className="agent-badge ai-badge">AI AGENT + LLM</span>
            </div>
            {activeStep === 4 && (
              <div className="step-details">
                <strong>Role:</strong> Intelligent opportunity analysis<br/>
                <strong>LLM:</strong> GPT-4o-mini with Temperature 0.3<br/>
                <strong>Process:</strong> Analyzes each opportunity name & description<br/>
                <strong>Output:</strong> Tags (AI/Analytics/Data), Confidence Scores, Rationale<br/>
                <strong>Returns to:</strong> Orchestrator with tagged opportunities
              </div>
            )}
          </div>

          {/* Arrow Up (return) */}
          <div className="arrow-return">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label return-label">Tagged Data (47 opportunities)</span>
          </div>

          {/* Step 6: Orchestrator (Final Review) */}
          <div className={`workflow-step orchestrator-step ${activeStep === 5 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 5 ? null : 5)}>
            <div className="step-icon orchestrator-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Orchestrator Agent</h3>
              <p>Reviews analysis results, routes to email composer</p>
            </div>
            {activeStep === 5 && (
              <div className="step-details">
                <strong>Action:</strong> Validates tagged data, groups by category<br/>
                <strong>Next Step:</strong> Routes to Email Composer for captain notifications
              </div>
            )}
          </div>

          {/* Arrow Down */}
          <div className="arrow-bidirectional">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label">Task: Generate Emails</span>
          </div>

          {/* Step 7: Email Composer Agent */}
          <div className={`workflow-step ai-agent-step ${activeStep === 6 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 6 ? null : 6)}>
            <div className="step-icon ai-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Email Composer Agent</h3>
              <p>Generates personalized captain emails</p>
              <span className="agent-badge ai-badge">AI AGENT + LLM</span>
            </div>
            {activeStep === 6 && (
              <div className="step-details">
                <strong>Role:</strong> Professional email generation<br/>
                <strong>LLM:</strong> GPT-4o-mini with Temperature 0.7 (creative)<br/>
                <strong>Process:</strong> Groups opportunities by tag, creates executive summaries<br/>
                <strong>Output:</strong> 3 personalized emails (AI, Analytics, Data captains)<br/>
                <strong>Returns to:</strong> Orchestrator with generated emails
              </div>
            )}
          </div>

          {/* Arrow Up (return) */}
          <div className="arrow-return">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label return-label">3 Email Drafts</span>
          </div>

          {/* Step 8: Final Orchestrator */}
          <div className={`workflow-step orchestrator-step ${activeStep === 7 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 7 ? null : 7)}>
            <div className="step-icon orchestrator-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" strokeWidth="2"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>Orchestrator Agent</h3>
              <p>Final validation and completion</p>
            </div>
            {activeStep === 7 && (
              <div className="step-details">
                <strong>Action:</strong> Validates all outputs, prepares final results<br/>
                <strong>Output:</strong> Complete analysis ready for user
              </div>
            )}
          </div>

          {/* Arrow Down */}
          <div className="arrow-down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m0 0l7-7m-7 7l-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="arrow-label">Complete Results</span>
          </div>

          {/* Step 9: END */}
          <div className={`workflow-step end-step ${activeStep === 8 ? 'active' : ''}`} onClick={() => setActiveStep(activeStep === 8 ? null : 8)}>
            <div className="step-icon end-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="step-content">
              <h3>COMPLETE</h3>
              <p>Results ready for download</p>
            </div>
            {activeStep === 8 && (
              <div className="step-details">
                <strong>Outputs:</strong><br/>
                • Tagged Excel file with AI/Analytics/Data classifications<br/>
                • Confidence scores and rationale for each opportunity<br/>
                • 3 personalized email drafts for D&AI captains
              </div>
            )}
          </div>

        </div>

        {/* Technical Summary */}
        <div className="tech-summary-new">
          <h3>Technical Stack</h3>
          <div className="tech-grid">
            <div className="tech-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2"/>
              </svg>
              <h4>LangGraph</h4>
              <p>Multi-agent orchestration framework</p>
            </div>
            <div className="tech-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 1v4m0 14v4" strokeWidth="2"/>
              </svg>
              <h4>GPT-4o-mini</h4>
              <p>OpenAI LLM for analysis and generation</p>
            </div>
            <div className="tech-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" strokeWidth="2"/>
              </svg>
              <h4>Real-time SSE</h4>
              <p>Server-Sent Events for live updates</p>
            </div>
            <div className="tech-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" strokeWidth="2"/>
              </svg>
              <h4>State Management</h4>
              <p>Persistent workflow state across agents</p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="features-section-new">
          <h3>Workflow Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon orchestrator-color">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2"/>
                </svg>
              </div>
              <h4>Bidirectional Communication</h4>
              <p>Agents send results back to orchestrator for validation and next-step routing</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon ai-color">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/>
                </svg>
              </div>
              <h4>Streaming Updates</h4>
              <p>Real-time progress tracking with detailed agent logs and status updates</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon start-color">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2"/>
                </svg>
              </div>
              <h4>Error Handling</h4>
              <p>Orchestrator validates each step and handles failures gracefully</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon end-color">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
                </svg>
              </div>
              <h4>Optimized Performance</h4>
              <p>Batch processing and parallel analysis for fast results</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
