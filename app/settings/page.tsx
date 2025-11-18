'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Instruction {
  id: string
  text: string
  category: 'AI' | 'Gen AI' | 'Analytics' | 'Data'
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [newInstruction, setNewInstruction] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'AI' | 'Gen AI' | 'Analytics' | 'Data'>('AI')
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
      // Set default instructions - focus on nature of work, not just keywords
      const defaultInstructions: Instruction[] = [
        // Traditional AI Rules
        {
          id: '1',
          text: 'Building predictive models or classification systems (e.g., fraud detection, customer churn prediction, risk scoring, forecasting demand)',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          text: 'Implementing computer vision or image recognition (e.g., object detection, facial recognition, quality inspection, document scanning)',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          text: 'Natural Language Processing for analysis or extraction (e.g., sentiment analysis, entity extraction, text classification, document understanding)',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          text: 'Recommendation systems or personalization engines (e.g., product recommendations, content matching, next-best-action)',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          text: 'Optimization and automation using ML (e.g., supply chain optimization, automated decision-making, intelligent process automation)',
          category: 'AI',
          createdAt: new Date().toISOString(),
        },
        
        // Gen AI Rules
        {
          id: '6',
          text: 'Building conversational AI or intelligent assistants using LLMs (e.g., chatbots with GPT/Claude, virtual agents, AI customer service)',
          category: 'Gen AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '7',
          text: 'Content generation or creative AI applications (e.g., automated content writing, marketing copy generation, image/video generation, code generation)',
          category: 'Gen AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '8',
          text: 'RAG systems or knowledge management with LLMs (e.g., enterprise search with AI, document Q&A, intelligent knowledge bases)',
          category: 'Gen AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '9',
          text: 'AI Copilot or augmentation tools (e.g., coding assistants, writing assistants, research assistants, workflow automation with AI)',
          category: 'Gen AI',
          createdAt: new Date().toISOString(),
        },
        {
          id: '10',
          text: 'Agentic AI or autonomous AI systems (e.g., AI agents that make decisions, multi-agent systems, AI workflow orchestration)',
          category: 'Gen AI',
          createdAt: new Date().toISOString(),
        },
        
        // Analytics Rules
        {
          id: '11',
          text: 'Business intelligence and reporting solutions (e.g., dashboards, KPI tracking, executive reporting, performance monitoring)',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '12',
          text: 'Data visualization and insights discovery (e.g., interactive visualizations, exploratory analysis, trend analysis, pattern discovery)',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '13',
          text: 'Customer or market analytics (e.g., customer segmentation, market basket analysis, customer journey analytics, cohort analysis)',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '14',
          text: 'Operational or financial analytics (e.g., cost analysis, revenue analytics, operational efficiency metrics, financial reporting)',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        {
          id: '15',
          text: 'Self-service analytics or data democratization (e.g., citizen analytics tools, business user reporting, ad-hoc analysis capabilities)',
          category: 'Analytics',
          createdAt: new Date().toISOString(),
        },
        
        // Data Rules
        {
          id: '16',
          text: 'Data platform modernization or infrastructure (e.g., data lake implementation, cloud data migration, data warehouse modernization, lakehouse architecture)',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
        {
          id: '17',
          text: 'Data integration and ETL/ELT pipelines (e.g., data ingestion, real-time streaming, batch processing, data orchestration, data sync)',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
        {
          id: '18',
          text: 'Data governance and quality management (e.g., data cataloging, metadata management, data lineage, data quality rules, master data management)',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
        {
          id: '19',
          text: 'Data architecture and engineering foundations (e.g., schema design, data modeling, performance optimization, data security implementation)',
          category: 'Data',
          createdAt: new Date().toISOString(),
        },
        {
          id: '20',
          text: 'Data consolidation or unification projects (e.g., merging systems post-acquisition, single source of truth, 360-degree views, data harmonization)',
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
  const genAiInstructions = instructions.filter(i => i.category === 'Gen AI')
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
            Define custom rules for identifying AI, Gen AI, Analytics, and Data opportunities
            <button className="help-tooltip-trigger" title="How to configure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12">
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
        
        <div className="settings-header-actions">
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
            <option value="Gen AI">Gen AI</option>
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
            <div className="category-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path d="M9 9h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2v4a2 2 0 002 2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <h3>Traditional AI Instructions ({aiInstructions.length})</h3>
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

        {/* Gen AI Instructions */}
        <div className="instruction-category">
          <div className="category-header genai">
            <div className="category-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <h3>Gen AI Instructions ({genAiInstructions.length})</h3>
          </div>
          <div className="instruction-list">
            {genAiInstructions.map((instruction) => (
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
            {genAiInstructions.length === 0 && (
              <p className="empty-state">No Gen AI instructions defined</p>
            )}
          </div>
        </div>

        {/* Analytics Instructions */}
        <div className="instruction-category">
          <div className="category-header analytics">
            <div className="category-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
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
            <div className="category-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeWidth="2"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeWidth="2"/>
              </svg>
            </div>
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
        <h3 className="help-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          How to Write Effective Instructions
        </h3>
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

