'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')

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

    try {
      const formData = new FormData()
      formData.append('file', file)

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 500)

      setTimeout(() => setProgressStatus('Orchestrator planning workflow...'), 500)
      setTimeout(() => setProgressStatus('Excel Reader parsing file...'), 1500)
      setTimeout(() => setProgressStatus('Filter Agent identifying opportunities...'), 3000)
      setTimeout(() => setProgressStatus('Analyzer Agent tagging with AI...'), 5000)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setProgressStatus('Complete!')

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
      <div className="main-content">
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

          <div className="info-box-compact">
            <strong>How it works:</strong> Filters US-Comms & Media opportunities • AI-powered tagging • Exports results
          </div>

          <footer>
            <p>Powered by OpenAI GPT-4o-mini • AI-driven opportunity analysis</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
