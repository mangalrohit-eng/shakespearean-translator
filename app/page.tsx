'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
            📋 Show Activity
          </button>
        )}

        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h1>🎯 Data & AI Opportunities Analyzer</h1>
              <p className="subtitle">
                Upload your opportunities Excel file to identify AI, Analytics, and Data-related deals
              </p>
            </div>
            <button
              className="back-btn"
              onClick={() => router.push('/settings')}
              style={{ marginTop: '8px' }}
            >
              ⚙ Configure Rules
            </button>
          </div>

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
              <div className="upload-icon-small">📊</div>
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
              <div className="file-icon-small">✓</div>
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
              ⏹️ Stop
            </button>
          ) : (
            <button
              className="analyze-btn-inline"
              onClick={handleAnalyze}
              disabled={!file}
            >
              🚀 Analyze
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
            <h3>🤖 Multi-Agent Pipeline</h3>
            <div className="agents-container">
              {agents.map((agent, index) => (
                <div 
                  key={agent.agent} 
                  className={`agent-card ${agent.status}`}
                >
                  <div className="agent-header">
                    <span className="agent-icon">
                      {agent.status === 'active' ? '🔄' : '✅'}
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

      {/* Results Section */}
      {showResults && results.length > 0 && (
        <div className="results-section">
          <div className="results-header-inline">
            <h2>📊 Analysis Results ({results.length} opportunities)</h2>
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
              💾 Download Excel
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

