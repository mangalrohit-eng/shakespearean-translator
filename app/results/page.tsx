'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { generateInsights } from '@/lib/analytics/insights'
import { AnalyzedOpportunity } from '@/lib/types'

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<AnalyzedOpportunity[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showInsights, setShowInsights] = useState(true)

  useEffect(() => {
    // Load results from sessionStorage
    const storedResults = sessionStorage.getItem('analysisResults')
    if (storedResults) {
      try {
        setResults(JSON.parse(storedResults))
      } catch (error) {
        console.error('Failed to parse stored results:', error)
        sessionStorage.removeItem('analysisResults')
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [router])

  // Generate insights
  const insights = useMemo(() => {
    if (results.length > 0) {
      return generateInsights(results)
    }
    return null
  }, [results])

  const stats = {
    total: results.length,
    aiCount: results.filter(r => r.tags.includes('AI')).length,
    analyticsCount: results.filter(r => r.tags.includes('Analytics')).length,
    dataCount: results.filter(r => r.tags.includes('Data')).length,
    multiTagged: results.filter(r => r.tags.length > 1).length,
    avgConfidence: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
      : 0,
    totalValue: results.reduce((sum, r) => sum + (r.total || 0), 0),
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
    const updated = results.map(r => 
      r.id === id ? { ...r, tags: editedTags } : r
    )
    setResults(updated)
    sessionStorage.setItem('analysisResults', JSON.stringify(updated))
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedTags([])
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
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
      a.download = `tagged-opportunities-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
            className="toggle-insights-btn"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? '📉 Hide Insights' : '📈 Show Insights'}
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

      {/* Key Statistics */}
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

      {/* Enhanced Insights */}
      {showInsights && insights && (
        <div className="insights-section">
          <h2>📊 ENHANCED ANALYTICS</h2>
          
          <div className="insights-grid">
            {/* Confidence Distribution */}
            <div className="insight-card">
              <h3>Confidence Distribution</h3>
              <div className="chart-container">
                <div className="bar-chart">
                  <div className="bar-group">
                    <div className="bar-label">High (80-100%)</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar high"
                        style={{ width: `${(insights.confidenceDistribution.high / stats.total) * 100}%` }}
                      >
                        <span className="bar-value">{insights.confidenceDistribution.high}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bar-group">
                    <div className="bar-label">Medium (50-79%)</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar medium"
                        style={{ width: `${(insights.confidenceDistribution.medium / stats.total) * 100}%` }}
                      >
                        <span className="bar-value">{insights.confidenceDistribution.medium}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bar-group">
                    <div className="bar-label">Low (0-49%)</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar low"
                        style={{ width: `${(insights.confidenceDistribution.low / stats.total) * 100}%` }}
                      >
                        <span className="bar-value">{insights.confidenceDistribution.low}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Co-Occurrence */}
            <div className="insight-card">
              <h3>Tag Combinations</h3>
              <div className="tag-occurrence-list">
                {insights.tagCoOccurrence.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="occurrence-item">
                    <div className="occurrence-label">{item.combination}</div>
                    <div className="occurrence-bar-wrapper">
                      <div 
                        className="occurrence-bar"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="occurrence-value">{item.count} ({item.percentage}%)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Keywords */}
            <div className="insight-card">
              <h3>Top Keywords in Opportunities</h3>
              <div className="keyword-cloud">
                {insights.topKeywords.map((kw, idx) => (
                  <div 
                    key={idx} 
                    className="keyword-item"
                    style={{ fontSize: `${0.9 + (kw.count / insights.topKeywords[0].count) * 0.6}rem` }}
                  >
                    {kw.keyword} <span className="keyword-count">({kw.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avg Confidence by Tag */}
            <div className="insight-card">
              <h3>Confidence by Category</h3>
              <div className="confidence-by-tag">
                {insights.averageConfidenceByTag.map((item, idx) => (
                  <div key={idx} className="confidence-tag-item">
                    <span className={`tag tag-${item.tag.toLowerCase()}`}>{item.tag}</span>
                    <div className="confidence-bar-small">
                      <div 
                        className="confidence-fill-small"
                        style={{ width: `${item.avgConfidence}%` }}
                      />
                    </div>
                    <span className="confidence-value-small">{item.avgConfidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client Breakdown */}
          <div className="insight-card-full">
            <h3>Top Clients by Opportunity Count</h3>
            <div className="client-table">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Total</th>
                    <th>AI</th>
                    <th>Analytics</th>
                    <th>Data</th>
                    <th>Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.clientBreakdown.slice(0, 10).map((client, idx) => (
                    <tr key={idx}>
                      <td className="client-name">{client.clientName}</td>
                      <td><strong>{client.total}</strong></td>
                      <td>{client.aiCount > 0 ? <span className="mini-badge ai">{client.aiCount}</span> : '-'}</td>
                      <td>{client.analyticsCount > 0 ? <span className="mini-badge analytics">{client.analyticsCount}</span> : '-'}</td>
                      <td>{client.dataCount > 0 ? <span className="mini-badge data">{client.dataCount}</span> : '-'}</td>
                      <td>
                        <div className="mini-confidence">
                          <div className="mini-confidence-bar">
                            <div 
                              className="mini-confidence-fill"
                              style={{ width: `${client.avgConfidence}%` }}
                            />
                          </div>
                          <span>{client.avgConfidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="results-table-container">
        <h2>ALL OPPORTUNITIES</h2>
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
                <td className="opp-name">{result.opportunityName}</td>
                <td>{result.accountName}</td>
                <td>{result.dealSize || '-'}</td>
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
