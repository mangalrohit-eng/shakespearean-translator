'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState<{ total: number; filtered: number } | null>(null)

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
    setStats(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze opportunities')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tagged-opportunities.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('Analysis complete! File downloaded successfully.')
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setError('')
    setSuccess('')
    setStats(null)
  }

  return (
    <div className="container">
      <h1>🎯 Data & AI Opportunities Analyzer</h1>
      <p className="subtitle">
        Upload your opportunities Excel file to identify AI, Analytics, and Data-related deals
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div
        className={`upload-area ${file ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!file ? (
          <>
            <div className="upload-icon">📊</div>
            <p className="upload-text">Drag & drop your Excel file here</p>
            <p className="upload-subtext">or</p>
            <label htmlFor="file-input" className="file-label">
              Browse Files
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="file-hint">Supports .xlsx and .xls files</p>
          </>
        ) : (
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button className="remove-btn" onClick={handleClear}>
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="info-box">
        <h3>📋 What this analyzer does:</h3>
        <ul>
          <li>✅ Filters opportunities from <strong>US-Comms & Media</strong> client group</li>
          <li>✅ Analyzes opportunity names for AI, Analytics, and Data keywords</li>
          <li>✅ Provides detailed rationale for each tagging decision</li>
          <li>✅ Exports results to a new Excel file with all tags and explanations</li>
        </ul>
      </div>

      <div className="button-container">
        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !file}
        >
          {loading ? (
            <span className="loading">
              <span className="spinner"></span>
              Analyzing Opportunities...
            </span>
          ) : (
            '🚀 Analyze Opportunities'
          )}
        </button>
      </div>

      <footer>
        <p>Powered by OpenAI GPT-4o-mini • AI-driven opportunity analysis</p>
      </footer>
    </div>
  )
}

