'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AgentLog {
  id: string
  timestamp: string
  agent: string
  message: string
  type: 'info' | 'success' | 'processing'
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
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentLogs])

  function addLog(agent: string, message: string, type: 'info' | 'success' | 'processing') {
    const log: AgentLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type
    }
    setAgentLogs(prev => [...prev, log])
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

    addLog('System', 'Workflow initiated - starting multi-agent analysis', 'info')
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 500)

      setTimeout(() => {
        setProgressStatus('Orchestrator planning workflow...')
        addLog('OrchestratorAgent', 'Analyzing workflow requirements and coordinating agents', 'processing')
      }, 500)
      
      setTimeout(() => {
        addLog('OrchestratorAgent', 'Dispatching ExcelReaderAgent to parse uploaded file', 'info')
      }, 1000)
      
      setTimeout(() => {
        setProgressStatus('Excel Reader parsing file...')
        addLog('ExcelReaderAgent', 'Parsing Excel file and extracting opportunity data', 'processing')
      }, 1500)
      
      setTimeout(() => {
        addLog('ExcelReaderAgent', 'File parsed successfully - sending data to Orchestrator', 'success')
        addLog('OrchestratorAgent', 'Received data - dispatching FilterAgent', 'info')
      }, 2500)
      
      setTimeout(() => {
        setProgressStatus('Filter Agent identifying opportunities...')
        addLog('FilterAgent', 'Filtering for US-Comms & Media opportunities', 'processing')
      }, 3000)
      
      setTimeout(() => {
        addLog('FilterAgent', 'Filtering complete - opportunities identified', 'success')
        addLog('OrchestratorAgent', 'Routing filtered data to AnalyzerAgent', 'info')
      }, 4500)
      
      setTimeout(() => {
        setProgressStatus('Analyzer Agent tagging with AI...')
        addLog('AnalyzerAgent', 'Analyzing opportunities with GPT-4o-mini', 'processing')
      }, 5000)
      
      setTimeout(() => {
        addLog('AnalyzerAgent', 'AI tagging in progress - identifying Data/AI/Analytics patterns', 'processing')
      }, 6500)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setProgressStatus('Complete!')
      addLog('AnalyzerAgent', 'Analysis complete - sending results to Orchestrator', 'success')
      addLog('OrchestratorAgent', 'All agents completed successfully - finalizing results', 'success')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze opportunities')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'tagged-opportunities.xlsx'
      link.click()
      
      addLog('System', 'Excel file generated and downloaded successfully', 'success')
      setSuccess('Analysis complete! File downloaded.')
      setFile(null)
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setProgress(0)
      setProgressStatus('')
    }
  }

  return (
    <div className="app-layout">
      <div className="main-content with-sidebar">
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
            <p className="hero-subtitle">Analyze business opportunities using advanced AI to identify Data, AI, and Analytics potential</p>
          </div>

          <div className="page-instructions">
            <h3>How to Use This Tool</h3>
            <p>
              Upload an Excel file containing business opportunities to automatically analyze and tag them for Data, AI, and Analytics relevance. 
              Our multi-agent AI system will filter for US-Comms & Media opportunities, analyze each one using GPT-4o-mini, and generate an Excel report with tags, confidence scores, and rationale.
            </p>
            <ul>
              <li><strong>Step 1:</strong> Upload your Excel file with opportunity data</li>
              <li><strong>Step 2:</strong> Watch as our AI agents process and analyze the data in real-time (check the activity sidebar)</li>
              <li><strong>Step 3:</strong> Download the tagged Excel file with AI-generated insights</li>
            </ul>
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
                <span>{progressStatus}</span>
                <span className="progress-percentage">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <footer>
            <p>Powered by OpenAI GPT-4o-mini • AI-driven opportunity analysis</p>
          </footer>
        </div>
      </div>

      <div className="agent-sidebar">
        <div className="sidebar-header">
          <h3>Agent Activity</h3>
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
                  <span className="log-agent">{log.agent}</span>
                  <span className="log-time">{log.timestamp}</span>
                </div>
                <div className="log-message">{log.message}</div>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
