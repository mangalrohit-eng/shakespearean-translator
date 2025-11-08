'use client'

import { useState } from 'react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate.')
      return
    }

    setLoading(true)
    setError('')
    setOutputText('')

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to translate text')
      }

      setOutputText(data.translated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setError('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTranslate()
    }
  }

  return (
    <div className="container">
      <h1>🎭 Shakespearean Translator</h1>
      <p className="subtitle">
        Transform your modern text into eloquent Shakespearean English
      </p>

      {error && <div className="error">{error}</div>}

      <div className="input-section">
        <label htmlFor="input">Enter your text:</label>
        <textarea
          id="input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your sentence here... (Ctrl+Enter to translate)"
          disabled={loading}
          rows={5}
        />
      </div>

      <div className="button-container">
        <button
          className="translate-btn"
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
        >
          {loading ? (
            <span className="loading">
              <span className="spinner"></span>
              Translating...
            </span>
          ) : (
            'Translate to Shakespearean'
          )}
        </button>
        <button className="clear-btn" onClick={handleClear} disabled={loading}>
          Clear
        </button>
      </div>

      <div className="output-section">
        <label htmlFor="output">Shakespearean Translation:</label>
        <div className={`output-box ${!outputText ? 'empty' : ''}`}>
          {outputText || 'Your translated text will appear here...'}
        </div>
      </div>

      <footer>
        <p>Powered by AI • Press Ctrl+Enter to translate quickly</p>
      </footer>
    </div>
  )
}

