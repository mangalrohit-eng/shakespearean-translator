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
      <div className="settings-header">
        <div>
          <h1>⚙ Analysis Configuration</h1>
          <p className="subtitle">
            Define custom rules for identifying AI, Analytics, and Data opportunities
          </p>
        </div>
        <div className="header-actions">
          <button className="back-btn" onClick={() => router.push('/')}>
            ← Back to Analyzer
          </button>
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

