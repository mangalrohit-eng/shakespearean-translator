'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../architecture.css'

export default function ArchitecturePage() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [animationStep, setAnimationStep] = useState(0)

  // Animate data flow through the system
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 8)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const agents = {
    start: {
      id: 'start',
      name: 'User Upload',
      x: 400,
      y: 50,
      color: '#00d4ff',
      icon: '📁',
      details: {
        role: 'Entry Point',
        input: 'Excel file with opportunity data',
        output: 'Raw data stream',
        tech: 'File upload API'
      }
    },
    orchestrator: {
      id: 'orchestrator',
      name: 'Orchestrator',
      x: 400,
      y: 200,
      color: '#a100ff',
      icon: '🎯',
      details: {
        role: 'Central Coordinator',
        llm: 'GPT-4o-mini',
        temperature: '0.2 (deterministic)',
        tasks: [
          'Validates data quality',
          'Routes tasks to specialized agents',
          'Reviews results from each agent',
          'Makes workflow decisions'
        ]
      }
    },
    excelReader: {
      id: 'excelReader',
      name: 'Excel Reader',
      x: 150,
      y: 350,
      color: '#00d4ff',
      icon: '📊',
      details: {
        role: 'Data Extraction',
        input: 'Excel file buffer',
        output: 'Raw JSON data',
        library: 'xlsx (SheetJS)'
      }
    },
    parser: {
      id: 'parser',
      name: 'Excel Parser',
      x: 400,
      y: 350,
      color: '#ff6b00',
      icon: '🔍',
      details: {
        role: 'Intelligent Column Mapping',
        llm: 'GPT-4o-mini',
        temperature: '0.1 (precise)',
        tasks: [
          'Identifies column names using LLM',
          'Maps to standard fields',
          'Handles naming variations',
          'Validates required fields'
        ]
      }
    },
    analyzer: {
      id: 'analyzer',
      name: 'Analyzer',
      x: 650,
      y: 350,
      color: '#ff6b00',
      icon: '🤖',
      details: {
        role: 'AI-Powered Tagging',
        llm: 'GPT-4o-mini',
        temperature: '0.3 (balanced)',
        tasks: [
          'Analyzes opportunity name & description',
          'Assigns AI/Analytics/Data tags',
          'Generates confidence scores',
          'Provides detailed rationale'
        ]
      }
    },
    emailComposer: {
      id: 'emailComposer',
      name: 'Email Composer',
      x: 400,
      y: 500,
      color: '#ff6b00',
      icon: '✉️',
      details: {
        role: 'Communication Generator',
        llm: 'GPT-4o-mini',
        temperature: '0.7 (creative)',
        tasks: [
          'Groups opportunities by account',
          'Generates personalized emails',
          'Includes IDs and rationale',
          'Filters to tagged opportunities only'
        ]
      }
    },
    complete: {
      id: 'complete',
      name: 'Results',
      x: 400,
      y: 650,
      color: '#00ff88',
      icon: '✅',
      details: {
        role: 'Output',
        outputs: [
          'Tagged Excel file',
          'Account-specific emails',
          'Confidence scores',
          'Analysis rationale'
        ]
      }
    }
  }

  const connections = [
    { from: 'start', to: 'orchestrator', label: 'Excel File', step: 0, stepNumber: 1, description: 'User uploads Excel file' },
    { from: 'orchestrator', to: 'excelReader', label: 'Read Request', step: 1, stepNumber: 2, description: 'Orchestrator sends to Excel Reader for validation' },
    { from: 'excelReader', to: 'orchestrator', label: 'Raw Data', step: 1, stepNumber: 3, description: 'Excel Reader returns raw JSON data' },
    { from: 'orchestrator', to: 'parser', label: 'Parse Task', step: 2, stepNumber: 4, description: 'Orchestrator routes to Parser for column mapping' },
    { from: 'parser', to: 'orchestrator', label: 'Structured Data', step: 2, stepNumber: 5, description: 'Parser returns structured opportunity data' },
    { from: 'orchestrator', to: 'analyzer', label: 'Analyze Task', step: 3, stepNumber: 6, description: 'Orchestrator sends to Analyzer for AI tagging' },
    { from: 'analyzer', to: 'orchestrator', label: 'Tagged Results', step: 3, stepNumber: 7, description: 'Analyzer returns tagged opportunities with confidence scores' },
    { from: 'orchestrator', to: 'emailComposer', label: 'Email Task', step: 4, stepNumber: 8, description: 'Orchestrator routes to Email Composer' },
    { from: 'emailComposer', to: 'orchestrator', label: 'Generated Emails', step: 4, stepNumber: 9, description: 'Email Composer returns personalized account emails' },
    { from: 'orchestrator', to: 'complete', label: 'Final Output', step: 5, stepNumber: 10, description: 'Orchestrator delivers final results to user' },
  ]

  const getPathBetweenAgents = (from: keyof typeof agents, to: keyof typeof agents) => {
    const fromAgent = agents[from]
    const toAgent = agents[to]
    
    const midX = (fromAgent.x + toAgent.x) / 2
    const midY = (fromAgent.y + toAgent.y) / 2
    
    // Create curved path
    return `M ${fromAgent.x} ${fromAgent.y} Q ${midX} ${midY} ${toAgent.x} ${toAgent.y}`
  }

  return (
    <div className="architecture-page-interactive">
      {/* Header */}
      <div className="arch-header-interactive">
        <Link href="/" className="back-btn-interactive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Tool
        </Link>
        <h1>Multi-Agent System Architecture</h1>
        <p className="subtitle-interactive">Interactive workflow visualization with real-time data flow</p>
      </div>

      {/* Main Content */}
      <div className="arch-content-interactive">
        
        <div className="architecture-layout">
          {/* Left Side - SVG Diagram */}
          <div className="diagram-section">
            <div className="diagram-container">
          <svg viewBox="0 0 800 700" className="workflow-diagram">
            <defs>
              {/* Arrow markers */}
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#a100ff" opacity="0.6" />
              </marker>
              
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connections */}
            <g className="connections">
              {connections.map((conn, idx) => {
                const fromAgent = agents[conn.from as keyof typeof agents]
                const toAgent = agents[conn.to as keyof typeof agents]
                const isActive = animationStep === conn.step
                
                return (
                  <g key={idx}>
                    {/* Connection line */}
                    <line
                      x1={fromAgent.x}
                      y1={fromAgent.y}
                      x2={toAgent.x}
                      y2={toAgent.y}
                      stroke={isActive ? '#a100ff' : 'rgba(161, 0, 255, 0.2)'}
                      strokeWidth={isActive ? '3' : '2'}
                      strokeDasharray={isActive ? '0' : '5,5'}
                      markerEnd="url(#arrowhead)"
                      className={isActive ? 'active-connection' : ''}
                    />
                    
                    {/* Data packet animation - moves along path */}
                    {isActive && (
                      <circle
                        r="6"
                        fill="#a100ff"
                        filter="url(#glow)"
                      >
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M ${fromAgent.x} ${fromAgent.y} L ${toAgent.x} ${toAgent.y}`}
                        />
                        <animate
                          attributeName="opacity"
                          values="0.3;1;0.3"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    
                    {/* Step number badge only - no text on connectors */}
                    {isActive && (
                      <g>
                        {/* Step number badge */}
                        <circle
                          cx={(fromAgent.x + toAgent.x) / 2}
                          cy={(fromAgent.y + toAgent.y) / 2}
                          r="16"
                          fill="#a100ff"
                          stroke="white"
                          strokeWidth="2.5"
                        >
                          <animate
                            attributeName="r"
                            values="16;18;16"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <text
                          x={(fromAgent.x + toAgent.x) / 2}
                          y={(fromAgent.y + toAgent.y) / 2 + 5}
                          fill="white"
                          fontSize="13"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {conn.stepNumber}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>

            {/* Agent Nodes */}
            <g className="agent-nodes">
              {Object.values(agents).map((agent) => {
                const isHovered = hoveredAgent === agent.id
                const isActive = connections.some(c => 
                  (c.from === agent.id || c.to === agent.id) && c.step === animationStep
                )
                
                return (
                  <g 
                    key={agent.id}
                    className={`agent-node ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    {/* Outer glow ring for active agents */}
                    {isActive && (
                      <circle
                        cx={agent.x}
                        cy={agent.y}
                        r="55"
                        fill="none"
                        stroke={agent.color}
                        strokeWidth="2"
                        opacity="0.4"
                      >
                        <animate
                          attributeName="r"
                          values="55;65;55"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0.1;0.4"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    
                    {/* Main circle */}
                    <circle
                      cx={agent.x}
                      cy={agent.y}
                      r={isHovered ? '52' : '48'}
                      fill={agent.color}
                      opacity="0.2"
                      className="agent-circle-bg"
                    />
                    <circle
                      cx={agent.x}
                      cy={agent.y}
                      r={isHovered ? '50' : '46'}
                      fill="rgba(255, 255, 255, 0.95)"
                      stroke={agent.color}
                      strokeWidth={isHovered ? '4' : '3'}
                      className="agent-circle"
                      style={{ transition: 'all 0.3s' }}
                    />
                    
                    {/* Icon */}
                    <text
                      x={agent.x}
                      y={agent.y + 8}
                      fontSize="32"
                      textAnchor="middle"
                    >
                      {agent.icon}
                    </text>
                    
                    {/* Name with better contrast */}
                    <rect
                      x={agent.x - 50}
                      y={agent.y + 55}
                      width="100"
                      height="22"
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="4"
                    />
                    <text
                      x={agent.x}
                      y={agent.y + 70}
                      fill="white"
                      fontSize="13"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {agent.name}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
            </div>
            {/* Legend below diagram */}
            <div className="architecture-legend">
              <h3>System Components</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-circle" style={{ background: '#00d4ff' }}></div>
                  <span>System I/O</span>
                </div>
                <div className="legend-item">
                  <div className="legend-circle" style={{ background: '#a100ff' }}></div>
                  <span>Orchestrator</span>
                </div>
                <div className="legend-item">
                  <div className="legend-circle" style={{ background: '#ff6b00' }}></div>
                  <span>AI Agents (LLM-powered)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-circle" style={{ background: '#00ff88' }}></div>
                  <span>Output</span>
                </div>
              </div>
              <p className="legend-note">💡 Hover over agents to see detailed information.</p>
            </div>
          </div>

          {/* Right Side - Workflow Steps */}
          <div className="workflow-steps-panel">
            <h3>Workflow Sequence</h3>
            <p className="steps-subtitle">Follow the numbered steps to understand the data flow</p>
            <div className="steps-list">
              {connections.map((conn) => (
                <div 
                  key={conn.stepNumber} 
                  className={`step-item ${animationStep >= conn.step ? 'active' : ''}`}
                >
                  <div className="step-number">{conn.stepNumber}</div>
                  <div className="step-content">
                    <div className="step-title">{conn.label}</div>
                    <div className="step-description">{conn.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Details Panel */}
        {hoveredAgent && (
          <div className="agent-details-panel">
            {(() => {
              const agent = agents[hoveredAgent as keyof typeof agents]
              return (
                <>
                  <div className="detail-header" style={{ borderLeftColor: agent.color }}>
                    <span className="detail-icon">{agent.icon}</span>
                    <h3>{agent.name}</h3>
                  </div>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Role:</span>
                      <span className="detail-value">{agent.details.role}</span>
                    </div>
                    
                    {'llm' in agent.details && agent.details.llm && (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">LLM:</span>
                          <span className="detail-value">{agent.details.llm}</span>
                        </div>
                        {'temperature' in agent.details && (
                          <div className="detail-row">
                            <span className="detail-label">Temperature:</span>
                            <span className="detail-value">{agent.details.temperature}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {'input' in agent.details && agent.details.input && (
                      <div className="detail-row">
                        <span className="detail-label">Input:</span>
                        <span className="detail-value">{agent.details.input}</span>
                      </div>
                    )}
                    
                    {'output' in agent.details && agent.details.output && (
                      <div className="detail-row">
                        <span className="detail-label">Output:</span>
                        <span className="detail-value">{agent.details.output}</span>
                      </div>
                    )}
                    
                    {'library' in agent.details && agent.details.library && (
                      <div className="detail-row">
                        <span className="detail-label">Library:</span>
                        <span className="detail-value">{agent.details.library}</span>
                      </div>
                    )}
                    
                    {'tech' in agent.details && agent.details.tech && (
                      <div className="detail-row">
                        <span className="detail-label">Tech:</span>
                        <span className="detail-value">{agent.details.tech}</span>
                      </div>
                    )}
                    
                    {'tasks' in agent.details && agent.details.tasks && (
                      <div className="detail-tasks">
                        <span className="detail-label">Tasks:</span>
                        <ul>
                          {agent.details.tasks.map((task, idx) => (
                            <li key={idx}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {'outputs' in agent.details && agent.details.outputs && (
                      <div className="detail-tasks">
                        <span className="detail-label">Outputs:</span>
                        <ul>
                          {agent.details.outputs.map((output, idx) => (
                            <li key={idx}>{output}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}


      </div>
    </div>
  )
}
