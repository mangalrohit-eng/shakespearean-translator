import { Opportunity, AnalyzedOpportunity } from '../types'
import { analyzeOpportunity, CustomInstruction } from '../agents/analyzer'

interface AnalysisState {
  completed: AnalyzedOpportunity[]
  pending: Opportunity[]
  inProgress: number
  timestamp: string
}

const STORAGE_KEY = 'analysis_state'
const CACHE_KEY_PREFIX = 'opp_cache_'
const BATCH_SIZE = 3 // Parallel requests
const RATE_LIMIT_DELAY = 1000 // 1 second between batches

export class ParallelAnalyzer {
  private aborted = false
  private state: AnalysisState | null = null

  // Save state for resume capability
  private saveState(state: AnalysisState) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      this.state = state
    } catch (error) {
      console.warn('Failed to save analysis state:', error)
    }
  }

  // Load saved state
  public loadState(): AnalysisState | null {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load analysis state:', error)
    }
    return null
  }

  // Clear saved state
  public clearState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
      this.state = null
    } catch (error) {
      console.warn('Failed to clear analysis state:', error)
    }
  }

  // Check cache for analyzed opportunity
  private getCachedAnalysis(oppId: string): AnalyzedOpportunity | null {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + oppId)
      if (cached) {
        const data = JSON.parse(cached)
        // Cache expires after 1 hour
        if (Date.now() - data.timestamp < 3600000) {
          return data.result
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error)
    }
    return null
  }

  // Save to cache
  private setCachedAnalysis(oppId: string, result: AnalyzedOpportunity) {
    try {
      sessionStorage.setItem(CACHE_KEY_PREFIX + oppId, JSON.stringify({
        result,
        timestamp: Date.now(),
      }))
    } catch (error) {
      console.warn('Cache write error:', error)
    }
  }

  // Abort analysis
  public abort() {
    this.aborted = true
  }

  // Analyze with parallel processing, caching, and resume capability
  public async analyzeOpportunities(
    opportunities: Opportunity[],
    customInstructions: CustomInstruction[] | undefined,
    onProgress: (current: number, total: number, currentOpp: string) => void,
    onAgentUpdate?: (agent: string, action: string, status: 'active' | 'complete') => void
  ): Promise<AnalyzedOpportunity[]> {
    this.aborted = false

    // Check for resume state
    const savedState = this.loadState()
    let completed: AnalyzedOpportunity[] = []
    let pending: Opportunity[] = []

    if (savedState && savedState.pending.length > 0) {
      // Resume from saved state
      completed = savedState.completed
      pending = savedState.pending
      console.log(`Resuming analysis: ${completed.length} completed, ${pending.length} remaining`)
    } else {
      // Start fresh
      pending = [...opportunities]
    }

    const total = opportunities.length
    let processed = completed.length

    // Agent update helper
    const updateAgent = (agent: string, action: string, status: 'active' | 'complete') => {
      if (onAgentUpdate) {
        onAgentUpdate(agent, action, status)
      }
    }

    try {
      // Process in batches
      while (pending.length > 0 && !this.aborted) {
        const batch = pending.splice(0, BATCH_SIZE)
        
        // Show which opportunities are being analyzed
        const batchNames = batch.slice(0, 2).map(o => `"${o.oppName.substring(0, 50)}${o.oppName.length > 50 ? '...' : ''}"`).join(', ')
        updateAgent('Analyzer Agent', `Analyzing: ${batchNames}${batch.length > 2 ? ` + ${batch.length - 2} more` : ''}`, 'active')

        // Check cache first
        const batchPromises = batch.map(async (opp) => {
          // Check cache
          const cached = this.getCachedAnalysis(opp.id)
          if (cached) {
            return cached
          }

          // Analyze
          const result = await analyzeOpportunity(opp, customInstructions)
          
          // Cache the result
          this.setCachedAnalysis(opp.id, result)
          
          return result
        })

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises)
        completed.push(...batchResults)
        processed += batchResults.length

        // Save state for resume
        this.saveState({
          completed,
          pending,
          inProgress: processed,
          timestamp: new Date().toISOString(),
        })

        // Update progress
        const currentOpp = batchResults[batchResults.length - 1]?.oppName || ''
        onProgress(processed, total, currentOpp)

        // Show specific tagging results
        const tagged = batchResults.filter(r => r.tags.length > 0)
        if (tagged.length > 0) {
          const sample = tagged[0]
          const shortRationale = sample.rationale.substring(0, 80).replace(/\n/g, ' ')
          updateAgent(
            'Analyzer Agent', 
            `✓ Tagged ${tagged.length}/${batchResults.length} in batch. Example: "${sample.oppName.substring(0, 40)}..." → ${sample.tags.join(', ')} (${shortRationale}...)`, 
            'complete'
          )
        } else {
          updateAgent('Analyzer Agent', `✓ Batch complete (${processed}/${total}). No tags assigned for reviewed opportunities.`, 'complete')
        }

        // Rate limiting - wait between batches
        if (pending.length > 0 && !this.aborted) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
        }
      }

      if (this.aborted) {
        updateAgent('Analyzer Agent', 'Analysis stopped by user', 'complete')
        throw new Error('Analysis aborted by user')
      }

      // Final summary from Analyzer
      const finalTagged = completed.filter(r => r.tags.length > 0)
      const aiCount = completed.filter(r => r.tags.includes('AI')).length
      const analyticsCount = completed.filter(r => r.tags.includes('Analytics')).length
      const dataCount = completed.filter(r => r.tags.includes('Data')).length
      
      updateAgent(
        'Analyzer Agent', 
        `Analysis complete: ${finalTagged.length}/${completed.length} opportunities tagged (AI: ${aiCount}, Analytics: ${analyticsCount}, Data: ${dataCount}). Sending results to Orchestrator.`, 
        'complete'
      )

      // Clear state on successful completion
      this.clearState()

      return completed
    } catch (error) {
      // Save state even on error for resume
      if (!this.aborted) {
        this.saveState({
          completed,
          pending,
          inProgress: processed,
          timestamp: new Date().toISOString(),
        })
      }
      throw error
    }
  }

  // Clear all caches
  public static clearAllCaches() {
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear caches:', error)
    }
  }
}

