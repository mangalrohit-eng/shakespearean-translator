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

  const insights = useMemo(() => {
    if (results.length > 0) {
      return generateInsights(results)
    }
    return null
  }, [results])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentLogs])

  const addLog = (
    agent: string,
    message: string,
    logType: string = 'info',
    agentType?: string,
    from?: string,
    to?: string,
    details?: string
  ) => {
    const log: AgentLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type: logType as 'info' | 'success' | 'processing',
      agentType: agentType as 'orchestrator' | 'agent' | 'tool' | undefined,
      from,
      to,
      details,
    }
    setAgentLogs(prev => [...prev, log])
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

      let resultsList: any[] = []
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
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
              let agentType = 'agent'
              const agentName = data.agent.toLowerCase()
              
              if (agentName.includes('orchestratoragent')) {
                agentType = 'orchestrator'
              } else if (agentName.includes('excelreaderagent') || agentName.includes('filteragent')) {
                agentType = 'tool'
              } else if (agentName.includes('analyzeragent')) {
                agentType = 'agent'
              }
              
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
              resultsList.push(data.opportunity)
            } else if (data.type === 'complete') {
              setResults(resultsList)
              setShowResults(true)
              setSuccess(`Analysis complete! ${resultsList.length} opportunities analyzed.`)
              return
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
            } catch (parseError) {
              console.warn('Failed to parse JSON chunk:', line, parseError)
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

  const downloadExcel = () => {
    if (results.length === 0) return

    const dataStr = JSON.stringify(results)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'analyzed-opportunities.json'
    link.click()
  }

  return (
    <div className="app-layout">
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

      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {!showSidebar && (
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setShowSidebar(true)}
          >
            ◫ Show Activity
          </button>
        )}

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

      {loading && progress && (
        <div className="progress-container">
          <div className="progress-header">
            <span>Processing: {progress.current} / {progress.total}</span>
            <span className="progress-percentage">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="progress-current">{progress.currentOpp}</div>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="results-section">
          <div className="results-header-inline">
            <h2>Analysis Results</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="analytics-btn-inline" onClick={() => setShowAnalyticsModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Analytics
              </button>
              <button className="download-btn-inline" onClick={downloadExcel}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Excel
              </button>
            </div>
          </div>

          <div className="results-stats-inline">
            <div className="stat-item-inline">
              <span className="stat-label-inline">Total Analyzed</span>
              <span className="stat-value-inline">{results.length}</span>
            </div>
            <div className="stat-item-inline">
              <span className="stat-label-inline">AI Tagged</span>
              <span className="stat-value-inline ai-color">{results.filter(r => r.tags.includes('AI')).length}</span>
            </div>
            <div className="stat-item-inline">
              <span className="stat-label-inline">Analytics Tagged</span>
              <span className="stat-value-inline analytics-color">{results.filter(r => r.tags.includes('Analytics')).length}</span>
            </div>
            <div className="stat-item-inline">
              <span className="stat-label-inline">Data Tagged</span>
              <span className="stat-value-inline data-color">{results.filter(r => r.tags.includes('Data')).length}</span>
            </div>
          </div>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Opportunity Name</th>
                  <th>Tags</th>
                  <th>Confidence</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.id}</td>
                    <td>{result.oppName}</td>
                    <td>
                      <div className="tags-cell">
                        {result.tags && result.tags.length > 0 ? (
                          result.tags.map((tag: string, i: number) => (
                            <span key={i} className={`tag tag-${tag.toLowerCase()}`}>{tag}</span>
                          ))
                        ) : (
                          <span className="tag tag-none">None</span>
                        )}
                      </div>
                    </td>
                    <td>{result.confidence}%</td>
                    <td className="rationale-cell">{result.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAnalyticsModal && results.length > 0 && insights && (
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
              <div className="analytics-section">
                <h3>Top Clients</h3>
                <div className="client-breakdown">
                  {insights.clientBreakdown.slice(0, 5).map((client: any, idx: number) => (
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
            </div>
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

