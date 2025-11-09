'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Instruction {
  id: string
  text: string
  category: 'AI' | 'Analytics' | 'Data'
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [newInstruction, setNewInstruction] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'AI' | 'Analytics' | 'Data'>('AI')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    // Load instructions from localStorage
    const stored = localStorage.getItem('analysisInstructions')
    let loaded = false
    
    if (stored) {
      try {
        setInstructions(JSON.parse(stored))
        loaded = true
      } catch (error) {
        console.error('Failed to parse stored instructions:', error)
        // Clear corrupted data and use defaults
        localStorage.removeItem('analysisInstructions')
      }
    }
    
    if (!loaded) {
      // Set default instructions
      const defaultInstructions: Instruction[] = [
        {
          id: '1',
          text: 'Contains keywords: machine learning, neural network, deep learning, computer vision, NLP',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          text: 'Mentions: chatbot, recommendation engine, predictive model, AI automation',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          text: 'Contains: dashboard, reporting, business intelligence, visualization, insights',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          text: 'Mentions: data analytics, predictive analytics, customer analytics, performance metrics',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          text: 'Contains: data lake, data warehouse, ETL, data pipeline, data migration',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
        {
          id: '6',
          text: 'Mentions: data engineering, data governance, data quality, master data management',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
      ]
      setInstructions(defaultInstructions)
      localStorage.setItem('analysisInstructions', JSON.stringify(defaultInstructions))
    }
  }, [])

  const saveInstructions = (updatedInstructions: Instruction[]) => {
    setInstructions(updatedInstructions)
    localStorage.setItem('analysisInstructions', JSON.stringify(updatedInstructions))
  }

  const handleAdd = () => {
    if (!newInstruction.trim()) return

    const instruction: Instruction = {
      id: Date.now().toString(),
      text: newInstruction.trim(),
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    }

    const updated = [...instructions, instruction]
    saveInstructions(updated)
    setNewInstruction('')
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this instruction?')) {
      const updated = instructions.filter(i => i.id !== id)
      saveInstructions(updated)
    }
  }

  const handleEdit = (instruction: Instruction) => {
    setEditingId(instruction.id)
    setEditText(instruction.text)
  }

  const handleSaveEdit = (id: string) => {
    const updated = instructions.map(i =>
      i.id === id ? { ...i, text: editText.trim() } : i
    )
    saveInstructions(updated)
    setEditingId(null)
    setEditText('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleReset = () => {
    if (confirm('Reset to default instructions? This cannot be undone.')) {
      localStorage.removeItem('analysisInstructions')
      window.location.reload()
    }
  }

  const aiInstructions = instructions.filter(i => i.category === 'AI')
  const analyticsInstructions = instructions.filter(i => i.category === 'Analytics')
  const dataInstructions = instructions.filter(i => i.category === 'Data')

  return (
    <div className="settings-container">
      {/* Accenture Header with Navigation */}
      <header className="accenture-header">
        <div className="accenture-header-container">
          <div className="accenture-brand">
            <svg className="accenture-logo-svg" viewBox="0 0 120 40" fill="none">
              <text x="0" y="28" fill="currentColor" fontSize="24" fontWeight="300" letterSpacing="-0.5">accenture</text>
              <path d="M115 8 L120 12 L115 16" stroke="#A100FF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <nav className="accenture-nav">
            <button className="accenture-nav-link" onClick={() => router.push('/')}>
              Analyze
            </button>
            <button className="accenture-nav-link" onClick={() => router.push('/architecture')}>
              Architecture
            </button>
            <button className="accenture-nav-link active" onClick={() => router.push('/settings')}>
              Settings
            </button>
          </nav>
        </div>
      </header>

      <div className="container">
        <div className="page-hero">
          <h1>Analysis Configuration</h1>
          <p className="hero-subtitle">
            Define custom rules for identifying AI, Analytics, and Data opportunities
            <button className="help-tooltip-trigger" title="How to configure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="tooltip-content">
                <strong>How to Configure Analysis Rules</strong>
                <ul>
                  <li><strong>Add:</strong> Type rules in natural language (e.g., "Contains: machine learning")</li>
                  <li><strong>Category:</strong> Choose AI, Analytics, or Data</li>
                  <li><strong>Edit/Delete:</strong> Click icons to modify or remove</li>
                  <li><strong>Reset:</strong> Restore defaults anytime</li>
                </ul>
                <p style={{marginTop: '8px', fontSize: '0.875rem', opacity: 0.9}}><strong>Note:</strong> Rules are saved locally and used by AnalyzerAgent during analysis.</p>
              </span>
            </button>
          </p>
        </div>
        
        <div className="header-actions" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="reset-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Add New Instruction */}
      <div className="add-instruction-section">
        <h2>Add New Instruction</h2>
        <div className="add-instruction-form">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="category-select"
          >
            <option value="AI">AI</option>
            <option value="Analytics">Analytics</option>
            <option value="Data">Data</option>
          </select>
          <input
            type="text"
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="E.g., Contains keywords: generative AI, LLM, GPT"
            className="instruction-input"
          />
          <button onClick={handleAdd} className="add-btn" disabled={!newInstruction.trim()}>
            Add Instruction
          </button>
        </div>
      </div>

      {/* Instructions by Category */}
      <div className="instructions-grid">
        {/* AI Instructions */}
        <div className="instruction-category">
          <div className="category-header ai">
            <span className="category-icon">🤖</span>
            <h3>AI Instructions ({aiInstructions.length})</h3>
          </div>
          <div className="instruction-list">
            {aiInstructions.map((instruction) => (
              <div key={instruction.id} className="instruction-item">
                {editingId === instruction.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSaveEdit(instruction.id)}
                        className="save-edit-btn"
                      >
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-edit-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="instruction-text">{instruction.text}</p>
                    <div className="instruction-actions">
                      <button
                        onClick={() => handleEdit(instruction)}
                        className="edit-icon-btn"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(instruction.id)}
                        className="delete-icon-btn"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {aiInstructions.length === 0 && (
              <p className="empty-state">No AI instructions defined</p>
            )}
          </div>
        </div>

        {/* Analytics Instructions */}
        <div className="instruction-category">
          <div className="category-header analytics">
            <span className="category-icon">📈</span>
            <h3>Analytics Instructions ({analyticsInstructions.length})</h3>
          </div>
          <div className="instruction-list">
            {analyticsInstructions.map((instruction) => (
              <div key={instruction.id} className="instruction-item">
                {editingId === instruction.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSaveEdit(instruction.id)}
                        className="save-edit-btn"
                      >
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-edit-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="instruction-text">{instruction.text}</p>
                    <div className="instruction-actions">
                      <button
                        onClick={() => handleEdit(instruction)}
                        className="edit-icon-btn"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(instruction.id)}
                        className="delete-icon-btn"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {analyticsInstructions.length === 0 && (
              <p className="empty-state">No Analytics instructions defined</p>
            )}
          </div>
        </div>

        {/* Data Instructions */}
        <div className="instruction-category">
          <div className="category-header data">
            <span className="category-icon">💾</span>
            <h3>Data Instructions ({dataInstructions.length})</h3>
          </div>
          <div className="instruction-list">
            {dataInstructions.map((instruction) => (
              <div key={instruction.id} className="instruction-item">
                {editingId === instruction.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSaveEdit(instruction.id)}
                        className="save-edit-btn"
                      >
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-edit-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="instruction-text">{instruction.text}</p>
                    <div className="instruction-actions">
                      <button
                        onClick={() => handleEdit(instruction)}
                        className="edit-icon-btn"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(instruction.id)}
                        className="delete-icon-btn"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {dataInstructions.length === 0 && (
              <p className="empty-state">No Data instructions defined</p>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>💡 How to Write Effective Instructions</h3>
        <ul>
          <li>
            <strong>Be specific:</strong> List exact keywords, phrases, or patterns to look for
          </li>
          <li>
            <strong>Use examples:</strong> "Contains: machine learning, AI, neural networks"
          </li>
          <li>
            <strong>Think about variations:</strong> Include common synonyms and related terms
          </li>
          <li>
            <strong>Consider context:</strong> Think about how these terms appear in opportunity names
          </li>
          <li>
            <strong>Test and refine:</strong> Run analyses and adjust instructions based on results
          </li>
        </ul>
      </div>
    </div>
  )
}

