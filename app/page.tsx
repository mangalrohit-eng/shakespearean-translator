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

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentLogs])

  // Add log entry
  const addLog = (
    agent: string, 
    message: string, 
    type: 'info' | 'success' | 'processing' = 'info',
    agentType?: 'orchestrator' | 'agent' | 'tool',
    from?: string,
    to?: string
  ) => {
    const log: AgentLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type,
      agentType,
      from,
      to,
    }
    setAgentLogs(prev => [...prev, log])
  }

  // Add communication log (agent-to-agent)
  const addCommunication = (from: string, to: string, message: string) => {
    addLog(`${from} → ${to}`, message, 'info', undefined, from, to)
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
              // Determine agent type
              let agentType: 'orchestrator' | 'agent' | 'tool' = 'agent'
              if (data.agent.toLowerCase().includes('orchestrator')) {
                agentType = 'orchestrator'
              } else if (data.agent.toLowerCase().includes('reader') || data.agent.toLowerCase().includes('writer') || data.agent.toLowerCase().includes('filter')) {
                agentType = 'tool'
              }
              
              // Add to logs
              const logType = data.status === 'complete' ? 'success' : 'processing'
              addLog(data.agent, data.action, logType, agentType)
              
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
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <div className="accenture-logo">
                <div className="accent-symbol">{'>'}</div>
                <div className="company-name">Accenture</div>
              </div>
              <div className="header-divider"></div>
              <div className="app-title">Opportunity Intelligence Platform</div>
            </div>
            <nav className="header-nav">
              <button className={`nav-item ${!showResults ? 'active' : ''}`}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analyze
              </button>
              <button className="nav-item" onClick={() => router.push('/settings')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/>
                </svg>
                Settings
              </button>
              {showResults && (
                <button className={`nav-item ${showAnalyticsModal ? 'active' : ''}`} onClick={() => setShowAnalyticsModal(true)}>
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Analytics
                </button>
              )}
            </nav>
          </div>
        </header>

        <div className="container">

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Upload and Analyze Section */}
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
              {useMemo(() => {
                const insights = generateInsights(results);
                return (
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
                );
              }, [results])}
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

