'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalyzedOpportunity {
  id: string
  clientName: string
  oppName: string
  clientGroup: string
  dealSize: string
  total: number
  tags: string[]
  rationale: string
  confidence: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<AnalyzedOpportunity[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load results from sessionStorage
    const storedResults = sessionStorage.getItem('analysisResults')
    if (storedResults) {
      setResults(JSON.parse(storedResults))
    } else {
      router.push('/')
    }
  }, [router])

  const stats = {
    total: results.length,
    aiCount: results.filter(r => r.tags.includes('AI')).length,
    analyticsCount: results.filter(r => r.tags.includes('Analytics')).length,
    dataCount: results.filter(r => r.tags.includes('Data')).length,
    multiTagged: results.filter(r => r.tags.length > 1).length,
    avgConfidence: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
      : 0,
    totalValue: results.reduce((sum, r) => sum + r.total, 0),
  }

  const handleEdit = (id: string, currentTags: string[]) => {
    setEditingId(id)
    setEditedTags([...currentTags])
  }

  const handleTagToggle = (tag: string) => {
    if (editedTags.includes(tag)) {
      setEditedTags(editedTags.filter(t => t !== tag))
    } else {
      setEditedTags([...editedTags, tag])
    }
  }

  const handleSave = (id: string) => {
    setResults(results.map(r => 
      r.id === id ? { ...r, tags: editedTags } : r
    ))
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedTags([])
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Send results to API for Excel generation
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate Excel file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tagged-opportunities.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Clear results and go back
      sessionStorage.removeItem('analysisResults')
      router.push('/')
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (confirm('Are you sure? Unsaved changes will be lost.')) {
      sessionStorage.removeItem('analysisResults')
      router.push('/')
    }
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>📊 Analysis Results</h1>
        <div className="header-actions">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <button 
            className="download-btn" 
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? 'Downloading...' : '💾 Download Excel'}
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Opportunities</div>
          </div>
        </div>
        
        <div className="stat-card ai">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{stats.aiCount}</div>
            <div className="stat-label">AI Opportunities</div>
            <div className="stat-percent">{Math.round((stats.aiCount / stats.total) * 100)}%</div>
          </div>
        </div>

        <div className="stat-card analytics">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.analyticsCount}</div>
            <div className="stat-label">Analytics</div>
            <div className="stat-percent">{Math.round((stats.analyticsCount / stats.total) * 100)}%</div>
          </div>
        </div>

        <div className="stat-card data">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{stats.dataCount}</div>
            <div className="stat-label">Data</div>
            <div className="stat-percent">{Math.round((stats.dataCount / stats.total) * 100)}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgConfidence}%</div>
            <div className="stat-label">Avg Confidence</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${(stats.totalValue / 1000).toFixed(0)}K</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Opportunity Name</th>
              <th>Client</th>
              <th>Deal Size</th>
              <th>Tags</th>
              <th>Confidence</th>
              <th>Rationale</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id}>
                <td className="opp-name">{result.oppName}</td>
                <td>{result.clientName}</td>
                <td>{result.dealSize}</td>
                <td>
                  {editingId === result.id ? (
                    <div className="tag-editor">
                      {['AI', 'Analytics', 'Data'].map(tag => (
                        <label key={tag} className="tag-checkbox">
                          <input
                            type="checkbox"
                            checked={editedTags.includes(tag)}
                            onChange={() => handleTagToggle(tag)}
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="tags">
                      {result.tags.length > 0 ? (
                        result.tags.map(tag => (
                          <span key={tag} className={`tag tag-${tag.toLowerCase()}`}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="tag tag-none">None</span>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div className="confidence">
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span>{result.confidence}%</span>
                  </div>
                </td>
                <td className="rationale">{result.rationale}</td>
                <td>
                  {editingId === result.id ? (
                    <div className="action-buttons">
                      <button 
                        className="save-btn"
                        onClick={() => handleSave(result.id)}
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={handleCancel}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(result.id, result.tags)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

