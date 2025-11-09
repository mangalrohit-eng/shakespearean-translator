'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { generateInsights } from '@/lib/analytics/insights'

interface ProgressUpdate {
  current: number
  total: number
  currentOpp: string
  status: string
}

interface AgentUpdate {
  agent: string
  action: string
  status: 'active' | 'complete'
}

interface AgentLog {
  id: string
  timestamp: string
  agent: string
  message: string
  type: 'info' | 'success' | 'processing'
  agentType?: 'orchestrator' | 'agent' | 'tool'
  from?: string
  to?: string
  details?: string
}

export default function Home() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)
  const [agents, setAgents] = useState<AgentUpdate[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Calculate analytics insights
  const insights = useMemo(() => {
    if (results.length > 0) {
      return generateInsights(results)
    }
    return null
  }, [results])

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentLogs])

  // Add log entry
  function addLog(
    agent: string, 
    message: string, 
    type?: 'info' | 'success' | 'processing',
    agentType?: 'orchestrator' | 'agent' | 'tool',
    from?: string,
    to?: string,
    details?: string
  ) {
    const logType = type || 'info'
    const log: AgentLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type: logType,
      agentType,
      from,
      to,
      details,
    }
    setAgentLogs(prev => [...prev, log])
  }

  // Add communication log (agent-to-agent)
  const addCommunication = (from: string, to: string, message: string) => {
    addLog(`${from} to ${to}`, message, 'info', undefined, from, to, undefined)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selectedFile)
      setError('')
      setSuccess('')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.xlsx') && !droppedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)')
        return
      }
      setFile(droppedFile)
      setError('')
      setSuccess('')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setProgress(null)
    setAgents([])
    setAgentLogs([])
    setResults([])
    setShowResults(false)
    addLog('Orchestrator', 'Initializing multi-agent analysis pipeline...', 'info', 'orchestrator')

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze opportunities')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      let results: any[] = []
      let buffer = '' // Buffer for incomplete chunks

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue
              
              const data = JSON.parse(jsonStr)
            
            if (data.type === 'progress') {
              setProgress(data)
            } else if (data.type === 'agent') {
              // Determine REAL agent type based on actual agent names
              let agentType: 'orchestrator' | 'agent' | 'tool' = 'agent'
              const agentName = data.agent.toLowerCase()
              
              if (agentName.includes('orchestratoragent') || agentName === 'orchestratoragent') {
                agentType = 'orchestrator'
              } else if (agentName.includes('excelreaderagent') || agentName.includes('filteragent')) {
                agentType = 'tool'
              } else if (agentName.includes('analyzeragent')) {
                agentType = 'agent'
              }
              
              // Add to logs with details
              const logType = data.status === 'complete' ? 'success' : 'processing'
              addLog(data.agent, data.action, logType, agentType, undefined, undefined, data.details)
              
              setAgents(prev => {
                const existing = prev.find(a => a.agent === data.agent)
                if (existing) {
                  return prev.map(a => 
                    a.agent === data.agent 
                      ? { agent: data.agent, action: data.action, status: data.status }
                      : a
                  )
                }
                return [...prev, { agent: data.agent, action: data.action, status: data.status }]
              })
            } else if (data.type === 'result') {
              results.push(data.opportunity)
            } else if (data.type === 'complete') {
              // Show results inline
              setResults(results)
              setShowResults(true)
              setSuccess(`Analysis complete! ${results.length} opportunities analyzed.`)
              return
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
            } catch (parseError) {
              console.warn('Failed to parse JSON chunk:', line, parseError)
              // Skip malformed chunks - they might be incomplete
            }
          }
        }
      }

      setFile(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Analysis stopped by user')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setLoading(false)
      setProgress(null)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
      setProgress(null)
      setAgents([])
    }
  }

  const handleClear = () => {
    setFile(null)
    setError('')
    setSuccess('')
    setProgress(null)
    setAgents([])
  }

  return (
    <div className="app-layout">
      {/* Agent Activity Sidebar */}
      {showSidebar && (
        <div className="agent-sidebar">
          <div className="sidebar-header">
            <h3>Agent Activity</h3>
            <button 
              className="sidebar-close-btn"
              onClick={() => setShowSidebar(false)}
              title="Close sidebar"
            >
              ✕
            </button>
          </div>
          <div className="agent-logs">
            {agentLogs.length === 0 ? (
              <div className="no-logs">
                <p>No activity yet</p>
                <p className="hint">Upload a file to start analysis</p>
              </div>
            ) : (
              agentLogs.map(log => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <div className="log-header">
                    <div className="log-agent-info">
                      <span className="log-agent">{log.agent}</span>
                      {log.agentType && (
                        <span className={`agent-type-badge ${log.agentType}`}>
                          {log.agentType === 'orchestrator' ? '🎯' : log.agentType === 'agent' ? '🤖' : '🔧'}
                          {' '}{log.agentType.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="log-time">{log.timestamp}</span>
                  </div>
                  <div className="log-message">{log.message}</div>
                  {log.details && (
                    <div className="log-details">{log.details}</div>
                  )}
                  {log.from && log.to && (
                    <div className="log-communication">
                      <span className="comm-arrow">→</span> Communication from {log.from} to {log.to}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {!showSidebar && (
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setShowSidebar(true)}
          >
            ◫ Show Activity
          </button>
        )}

        {/* Accenture Header */}
        <header className="accenture-header">
          <div className="accenture-header-container">
            <div className="accenture-brand">
              <svg className="accenture-logo-svg" viewBox="0 0 120 40" fill="none">
                <text x="0" y="28" fill="currentColor" fontSize="24" fontWeight="300" letterSpacing="-0.5">accenture</text>
                <path d="M115 8 L120 12 L115 16" stroke="#A100FF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <nav className="accenture-nav">
              <button 
                className={`accenture-nav-link ${!showResults ? 'active' : ''}`}
                onClick={() => {
                  if (showResults) {
                    setShowResults(false)
                    setResults([])
                    setFile(null)
                    setError('')
                    setSuccess('')
                    setProgress(null)
                    setAgents([])
                    setAgentLogs([])
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Analyze
              </button>
              <button className="accenture-nav-link" onClick={() => router.push('/architecture')}>
                Architecture
              </button>
              <button className="accenture-nav-link" onClick={() => router.push('/settings')}>
                Settings
              </button>
              {showResults && (
                <button className={`accenture-nav-link ${showAnalyticsModal ? 'active' : ''}`} onClick={() => setShowAnalyticsModal(true)}>
                  Analytics
                </button>
              )}
            </nav>
            <button 
              className="activity-toggle-btn"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
                <rect x="14" y="3" width="7" height="7" strokeWidth="2" rx="1"/>
                <rect x="14" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
                <rect x="3" y="14" width="7" height="7" strokeWidth="2" rx="1"/>
              </svg>
              <span>Activity</span>
            </button>
          </div>
        </header>

        <div className="container">
          
          {!showResults && (
            <div className="page-hero">
              <h1>Data & AI Opportunity Intelligence</h1>
              <p className="hero-subtitle">Analyze business opportunities using advanced AI to identify Data, AI, and Analytics potential</p>
            </div>
          )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Upload and Analyze Section */}
      {!showResults && (
      <div className="upload-analyze-section">
        <div
          className={`upload-area-compact ${file ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!file ? (
            <>
              <div className="upload-icon-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                  <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 15l3 -3l3 3" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 12l0 9" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="upload-text-small">Drag & drop or</p>
                <label htmlFor="file-input" className="file-label-inline">
                  Browse Files
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </>
          ) : (
            <div className="file-info-inline">
              <div className="file-icon-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path d="M20 6L9 17l-5-5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="file-details-inline">
                <p className="file-name-small">{file.name}</p>
                <p className="file-size-small">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button className="remove-btn-small" onClick={handleClear}>
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="analyze-button-section">
          {loading ? (
            <button
              className="stop-btn-inline"
              onClick={handleStop}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <rect x="6" y="6" width="12" height="12" rx="1"/>
              </svg>
              Stop
            </button>
          ) : (
            <button
              className="analyze-btn-inline"
              onClick={handleAnalyze}
              disabled={!file}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path d="M5 3l14 9-14 9V3z" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              Analyze
            </button>
          )}
        </div>
      </div>

      <div className="info-box-compact">
        <strong>How it works:</strong> Filters US-Comms & Media opportunities • AI-powered tagging • Exports results
      </div>
      )}

      {loading && (
        <>
          {/* Agent Pipeline Visualization */}
          <div className="agent-pipeline">
            <h3>Multi-Agent Pipeline</h3>
            <div className="agents-container">
              {agents.map((agent, index) => (
                <div 
                  key={agent.agent} 
                  className={`agent-card ${agent.status}`}
                >
                  <div className="agent-header">
                    <span className="agent-icon">
                      {agent.status === 'active' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                          <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="agent-name">{agent.agent}</span>
                  </div>
                  <div className="agent-action">{agent.action}</div>
                  {agent.status === 'active' && (
                    <div className="agent-spinner"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-title">📊 Overall Progress</span>
                <span className="progress-count">
                  {progress.current} / {progress.total} opportunities
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="progress-details">
                <div className="current-opp">
                  <strong>Current:</strong> {progress.currentOpp}
                </div>
                <div className="progress-status">
                  <span className="status-badge">{progress.status}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && results.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detailed Analytics</h2>
              <button className="modal-close" onClick={() => setShowAnalyticsModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path d="M6 6l12 12M6 18L18 6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {insights ? (
                <>
                  {/* Client Breakdown */}
                  <div className="analytics-section">
                    <h3>Top Clients</h3>
                    <div className="client-breakdown">
                      {insights.clientBreakdown.slice(0, 5).map((client, idx) => (
                        <div key={idx} className="client-row">
                          <div className="client-info">
                            <strong>{client.clientName}</strong>
                            <span className="client-total">{client.total} opportunities</span>
                          </div>
                          <div className="client-tags">
                            {client.aiCount > 0 && <span className="mini-tag ai">AI: {client.aiCount}</span>}
                            {client.analyticsCount > 0 && <span className="mini-tag analytics">Analytics: {client.analyticsCount}</span>}
                            {client.dataCount > 0 && <span className="mini-tag data">Data: {client.dataCount}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Distribution */}
                  <div className="analytics-section">
                    <h3>Confidence Distribution</h3>
                    <div className="confidence-chart">
                      <div className="conf-bar">
                        <span>High (80-100%)</span>
                        <div className="conf-bar-fill" style={{width: `${(insights.confidenceDistribution.high / results.length) * 100}%`, background: 'var(--success-green)'}}>
                          {insights.confidenceDistribution.high}
                        </div>
                      </div>
                      <div className="conf-bar">
                        <span>Medium (50-79%)</span>
                        <div className="conf-bar-fill" style={{width: `${(insights.confidenceDistribution.medium / results.length) * 100}%`, background: 'var(--warning-orange)'}}>
                          {insights.confidenceDistribution.medium}
                        </div>
                      </div>
                      <div className="conf-bar">
                        <span>Low (0-49%)</span>
                        <div className="conf-bar-fill" style={{width: `${(insights.confidenceDistribution.low / results.length) * 100}%`, background: 'var(--accenture-gray)'}}>
                          {insights.confidenceDistribution.low}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tag Co-occurrence */}
                  <div className="analytics-section">
                    <h3>Tag Combinations</h3>
                    <div className="tag-combos">
                      {insights.tagCoOccurrence.slice(0, 6).map((combo, idx) => (
                        <div key={idx} className="combo-item">
                          <span className="combo-label">{combo.combination}</span>
                          <span className="combo-value">{combo.count} ({combo.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Keywords */}
                  <div className="analytics-section">
                    <h3>Top Keywords</h3>
                    <div className="keywords-list">
                      {insights.topKeywords.slice(0, 10).map((kw, idx) => (
                        <span key={idx} className="keyword-badge">
                          {kw.keyword} ({kw.count})
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{padding: '40px', textAlign: 'center', color: 'var(--accenture-gray)'}}>
                  No analytics data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && results.length > 0 && (
        <div className="results-section">
          <div className="results-header-inline">
            <h2>Analysis Results ({results.length} opportunities)</h2>
            <button 
              className="download-btn-inline"
              onClick={async () => {
                const response = await fetch('/api/export', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ results }),
                })
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analysis-${new Date().toISOString().split('T')[0]}.xlsx`
                a.click()
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download Excel
            </button>
          </div>

          <div className="results-stats-inline">
            <div className="stat-inline">
              <span className="stat-label-inline">AI:</span>
              <span className="stat-value-inline">{results.filter(r => r.tags.includes('AI')).length}</span>
            </div>
            <div className="stat-inline">
              <span className="stat-label-inline">Analytics:</span>
              <span className="stat-value-inline">{results.filter(r => r.tags.includes('Analytics')).length}</span>
            </div>
            <div className="stat-inline">
              <span className="stat-label-inline">Data:</span>
              <span className="stat-value-inline">{results.filter(r => r.tags.includes('Data')).length}</span>
            </div>
            <div className="stat-inline">
              <span className="stat-label-inline">Avg Confidence:</span>
              <span className="stat-value-inline">
                {Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)}%
              </span>
            </div>
          </div>

          <div className="results-table-inline">
            <table>
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Tags</th>
                  <th>Confidence</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((result, idx) => (
                  <tr key={idx}>
                    <td className="opp-name-inline">{result.oppName}</td>
                    <td>
                      <div className="tags-inline">
                        {result.tags.length > 0 ? (
                          result.tags.map((tag: string) => (
                            <span key={tag} className={`tag tag-${tag.toLowerCase()}`}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="tag tag-none">None</span>
                        )}
                      </div>
                    </td>
                    <td>{result.confidence}%</td>
                    <td className="rationale-inline">{result.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 10 && (
              <div className="results-footer-inline">
                Showing 10 of {results.length} opportunities. Download Excel to see all.
              </div>
            )}
          </div>
        </div>
      )}

          <footer>
            <p>Powered by OpenAI GPT-4o-mini • AI-driven opportunity analysis</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

