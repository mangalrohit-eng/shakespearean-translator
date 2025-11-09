'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AgentLog {
  id: string
  timestamp: string
  agent: string
  message: string
  type: 'info' | 'success' | 'processing'
  detailedData?: any
}

export default function Home() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeTab, setActiveTab] = useState('results')
  const abortControllerRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentLogs])

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('agentSidebarOpen')
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true')
    }
  }, [])

  function toggleSidebar() {
    const newState = !isSidebarOpen
    setIsSidebarOpen(newState)
    localStorage.setItem('agentSidebarOpen', String(newState))
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      addLog('System', 'Analysis stopped by user', 'info')
      setLoading(false)
      setProgress(0)
      setProgressStatus('Cancelled')
      setTimeout(() => {
        setProgressStatus('')
      }, 3000)
    }
  }

  function addLog(agent: string, message: string, type: 'info' | 'success' | 'processing', detailedData?: any) {
    const log: AgentLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type,
      detailedData
    }
    setAgentLogs(prev => [...prev, log])
  }

  function getMessageClass(message: string) {
    if (message.includes('Reasoning:') || message.includes('LLM Reasoning:')) {
      return 'log-message reasoning-message'
    }
    if (message.includes('Decision:')) {
      return 'log-message decision-message'
    }
    if (message.startsWith('→')) {
      return 'log-message dispatch-message'
    }
    return 'log-message'
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleAnalyze() {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setProgress(0)
    setProgressStatus('Initializing AI agents...')
    setAgentLogs([])
    setResults([])
    setShowResults(false)

    // Create abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    addLog('System', 'Workflow initiated - connecting to real agent pipeline', 'info')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Get custom instructions from localStorage
      const storedInstructions = localStorage.getItem('customInstructions')
      if (storedInstructions) {
        formData.append('customInstructions', storedInstructions)
      }

      // Use the streaming endpoint to get REAL agent data
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to start analysis')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'agent') {
                  // Real agent activity from backend with REAL data
                  const logType = data.status === 'active' ? 'processing' : data.status === 'complete' ? 'success' : 'info'
                  addLog(data.agent, data.action, logType, data.details)
                  setProgress(prev => Math.min(prev + 3, 90))
                } else if (data.type === 'progress') {
                  setProgressStatus(`Analyzing opportunity ${data.current} of ${data.total}`)
                  if (data.currentOpp) {
                    setProgressStatus(prev => `${prev} - "${data.currentOpp}"`)
                  }
                  setProgress((data.current / data.total) * 90)
                } else if (data.type === 'result') {
                  // Collect results for preview
                  setResults(prev => [...prev, data.opportunity])
                } else if (data.type === 'complete') {
                  setProgress(100)
                  setProgressStatus('Complete!')
                  addLog('System', `Analysis complete! ${data.total} opportunities processed.`, 'success')
                  setShowResults(true)
                  setSuccess(`Analysis complete! ${data.total} opportunities processed.`)
                } else if (data.type === 'error') {
                  throw new Error(data.message)
                }
              } catch (e: any) {
                console.warn('Failed to parse SSE data:', e)
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled - already handled in handleStop
        return
      }
      setError(err instanceof Error ? err.message : 'An error occurred')
      addLog('System', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'info')
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  async function handleDownload() {
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const storedInstructions = localStorage.getItem('customInstructions')
      if (storedInstructions) {
        formData.append('customInstructions', storedInstructions)
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'tagged-opportunities.xlsx'
        link.click()
        setSuccess('Excel file downloaded successfully!')
      } else {
        throw new Error('Failed to generate Excel file')
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }

  // Generate emails for D&AI captains
  function generateCaptainEmails() {
    const aiOpps = results.filter((r: any) => r.tags.includes('AI'))
    const analyticsOpps = results.filter((r: any) => r.tags.includes('Analytics'))
    const dataOpps = results.filter((r: any) => r.tags.includes('Data'))

    const generateEmail = (captain: string, tag: string, opportunities: any[]) => {
      return {
        captain,
        tag,
        subject: `D&AI Opportunity Review - ${tag} Focus Areas (${opportunities.length} Opportunities)`,
        body: `
<div class="email-content">
  <p>Dear ${tag} Captain,</p>
  
  <p>I hope this email finds you well. As part of our ongoing Data & AI opportunity identification initiative, 
  our AI-powered analysis system has identified <strong>${opportunities.length} opportunities</strong> within the 
  Comms & Media sector that align with <strong>${tag}</strong> capabilities.</p>
  
  <h3>Executive Summary</h3>
  <ul>
    <li><strong>Total Opportunities:</strong> ${opportunities.length}</li>
    <li><strong>Focus Area:</strong> ${tag}</li>
    <li><strong>Sector:</strong> Communications & Media</li>
    <li><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</li>
  </ul>
  
  <h3>Opportunity Details</h3>
  <table class="email-table">
    <thead>
      <tr>
        <th>Opportunity ID</th>
        <th>Opportunity Name</th>
        <th>Tags</th>
        <th>Confidence</th>
        <th>Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${opportunities.map((opp: any) => `
        <tr>
          <td>${opp.id}</td>
          <td><strong>${opp.dealName}</strong></td>
          <td>${opp.tags.join(', ')}</td>
          <td>${opp.confidence}%</td>
          <td>${opp.rationale}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h3>Recommended Next Steps</h3>
  <ol>
    <li><strong>Priority Review:</strong> Review opportunities with confidence scores above 80% for immediate engagement</li>
    <li><strong>Client Engagement:</strong> Coordinate with account teams to schedule discovery sessions</li>
    <li><strong>Solution Mapping:</strong> Identify relevant ${tag} solutions and case studies from our portfolio</li>
    <li><strong>Proposal Development:</strong> Prepare tailored value propositions highlighting ${tag} capabilities</li>
  </ol>
  
  <p>Please let me know if you need any additional information or would like to discuss any of these opportunities in detail.</p>
  
  <p>Best regards,<br>
  <strong>Data & AI Opportunity Intelligence System</strong><br>
  Accenture | Communications & Media</p>
</div>
        `.trim()
      }
    }

    const emails = []
    if (aiOpps.length > 0) emails.push(generateEmail('AI Captain', 'AI', aiOpps))
    if (analyticsOpps.length > 0) emails.push(generateEmail('Analytics Captain', 'Analytics', analyticsOpps))
    if (dataOpps.length > 0) emails.push(generateEmail('Data Captain', 'Data', dataOpps))

    return emails
  }

  const captainEmails = showResults ? generateCaptainEmails() : []

  return (
    <div className="app-layout">
      <div className={`main-content ${isSidebarOpen ? 'with-sidebar' : ''}`}>
        <header className="accenture-header">
          <div className="accenture-header-container">
            <div className="accenture-brand">
              <svg className="accenture-logo-svg" viewBox="0 0 120 40" fill="none">
                <text x="0" y="28" fill="currentColor" fontSize="24" fontWeight="300" letterSpacing="-0.5">accenture</text>
                <path d="M115 8 L120 12 L115 16" stroke="#A100FF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <nav className="accenture-nav">
              <button className="accenture-nav-link active">Analyze</button>
              <button className="accenture-nav-link" onClick={() => router.push('/architecture')}>Architecture</button>
              <button className="accenture-nav-link" onClick={() => router.push('/settings')}>Settings</button>
            </nav>
          </div>
        </header>

        <div className="container">
          <div className="page-hero">
            <h1>Data & AI Opportunity Intelligence</h1>
            <p className="hero-subtitle">
              Analyze business opportunities using advanced AI to identify Data, AI, and Analytics potential
              <button className="help-tooltip-trigger" title="How to use this tool">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="tooltip-content">
                  <strong>How to Use This Tool</strong>
                  <ol>
                    <li>Upload your Excel file with opportunity data</li>
                    <li>Watch as AI agents process and analyze in real-time</li>
                    <li>Review results and download tagged Excel file</li>
                  </ol>
                  <p style={{marginTop: '8px', fontSize: '0.875rem', opacity: 0.9}}>Our multi-agent system filters for US-Comms & Media opportunities and uses GPT-4o-mini to generate tags, confidence scores, and rationale.</p>
                </span>
              </button>
            </p>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="upload-analyze-section">
            <div className="upload-area-compact">
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
                  <button className="remove-btn-small" onClick={() => setFile(null)}>✕</button>
                </div>
              )}
            </div>

            <div className="analyze-button-section">
              <button
                className="analyze-btn-inline"
                onClick={handleAnalyze}
                disabled={!file || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M5 3l14 9-14 9V3z" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {loading && progress > 0 && (
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-status-text">{progressStatus}</span>
                <button 
                  className="stop-btn" 
                  onClick={handleStop}
                  aria-label="Stop analysis"
                  title="Stop analysis"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12">
                    <rect x="6" y="6" width="12" height="12" strokeWidth="2" fill="currentColor"/>
                  </svg>
                  Stop
                </button>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  >
                    <span className="progress-fill-text">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="results-preview">
              <div className="results-header">
                <h2>Analysis Results</h2>
                <button className="download-excel-btn" onClick={handleDownload}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download Excel
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className="results-tabs">
                <button 
                  className={`results-tab ${activeTab === 'results' ? 'active' : ''}`}
                  onClick={() => setActiveTab('results')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" strokeWidth="2"/>
                  </svg>
                  Analysis Results
                </button>
                {captainEmails.map((email, idx) => (
                  <button 
                    key={idx}
                    className={`results-tab ${activeTab === `email-${email.tag.toLowerCase()}` ? 'active' : ''}`}
                    onClick={() => setActiveTab(`email-${email.tag.toLowerCase()}`)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2"/>
                      <path d="M22 6l-10 7L2 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {email.captain}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              {activeTab === 'results' && (
                <>
                  <div className="results-summary">
                    <div className="summary-stat">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">{results.length}</span>
                    </div>
                    <div className="summary-stat ai">
                      <span className="stat-label">AI</span>
                      <span className="stat-value">{results.filter(r => r.tags.includes('AI')).length}</span>
                    </div>
                    <div className="summary-stat analytics">
                      <span className="stat-label">Analytics</span>
                      <span className="stat-value">{results.filter(r => r.tags.includes('Analytics')).length}</span>
                    </div>
                    <div className="summary-stat data">
                      <span className="stat-label">Data</span>
                      <span className="stat-value">{results.filter(r => r.tags.includes('Data')).length}</span>
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
                        {results.slice(0, 10).map((result, idx) => (
                          <tr key={idx}>
                            <td>{result.id}</td>
                            <td>{result.dealName}</td>
                            <td>
                              <div className="tags-cell">
                                {result.tags.map((tag: string, i: number) => (
                                  <span key={i} className={`tag tag-${tag.toLowerCase()}`}>{tag}</span>
                                ))}
                                {result.tags.length === 0 && <span className="tag tag-none">None</span>}
                              </div>
                            </td>
                            <td>{result.confidence}%</td>
                            <td className="rationale-cell">{result.rationale}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {results.length > 10 && (
                      <p className="table-footer">Showing 10 of {results.length} results. Download Excel for full report.</p>
                    )}
                  </div>
                </>
              )}

              {/* Email Content Tabs */}
              {captainEmails.map((email, idx) => (
                activeTab === `email-${email.tag.toLowerCase()}` && (
                  <div key={idx} className="email-view">
                    <div className="email-header-info">
                      <div className="email-field">
                        <span className="email-label">To:</span>
                        <span className="email-value">{email.captain} &lt;{email.tag.toLowerCase()}.captain@accenture.com&gt;</span>
                      </div>
                      <div className="email-field">
                        <span className="email-label">From:</span>
                        <span className="email-value">D&AI Opportunity Intelligence &lt;dai-ops@accenture.com&gt;</span>
                      </div>
                      <div className="email-field">
                        <span className="email-label">Subject:</span>
                        <span className="email-value">{email.subject}</span>
                      </div>
                      <div className="email-field">
                        <span className="email-label">Date:</span>
                        <span className="email-value">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="email-body" dangerouslySetInnerHTML={{ __html: email.body }} />
                  </div>
                )
              ))}
            </div>
          )}

          <footer>
            <div className="footer-content">
              <div className="footer-section">
                <span className="footer-label">Technology Stack</span>
                <span className="footer-value">Next.js 14 • LangGraph 1.0 • OpenAI GPT-4o-mini</span>
              </div>
              <div className="footer-section">
                <span className="footer-label">Version</span>
                <span className="footer-value">1.0.0</span>
              </div>
              <div className="footer-section">
                <span className="footer-label">© 2025 Accenture</span>
                <span className="footer-value">Enterprise AI Solutions</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <div className={`agent-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <button 
          className="sidebar-toggle-handle" 
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            {isSidebarOpen ? (
              <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
        <div className="sidebar-header">
          <h3>Agent Activity</h3>
        </div>
        <div className="agent-logs">
          {agentLogs.length === 0 ? (
            <div className="no-logs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48" className="empty-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="empty-title">AI Agents Ready</p>
              <p className="hint">Upload an Excel file to begin intelligent analysis</p>
            </div>
          ) : (
            agentLogs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <div className="log-header">
                  <span className="log-agent">{log.agent}</span>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    {log.detailedData && (
                      <span className="log-details-indicator">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                          <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    )}
                    <span className="log-time">{log.timestamp}</span>
                  </div>
                </div>
                <div className={getMessageClass(log.message)}>{log.message}</div>
                {log.detailedData && (
                  <div className="log-details-tooltip">
                    <div className="tooltip-header">Payload Data</div>
                    <pre className="tooltip-payload">
                      {JSON.stringify(log.detailedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
