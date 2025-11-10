import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'
import { analyzeOpportunity } from './analyzer'
import { Opportunity, AnalyzedOpportunity } from '../types'

/**
 * Analyzer Agent
 * Uses LLM to analyze each opportunity sequentially and tag with AI/Analytics/Data categories
 * This is the main AI-powered agent that does the intelligent tagging
 */
export async function analyzerAgent(
  state: WorkflowState,
  onUpdate?: (updatedState: Partial<WorkflowState>) => void
): Promise<Partial<WorkflowState>> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
  })

  const totalOpportunities = state.filteredOpportunities.length

  // Log agent start
  const agentLogs = [
    ...state.agentLogs,
    {
      agent: 'AnalyzerAgent',
      action: `Initializing AI analysis for ${totalOpportunities} opportunities (sequential processing)`,
      status: 'active' as const,
      timestamp: new Date().toISOString(),
    },
  ]

  try {
    // Agent reasoning: Understand analysis task
    const reasoningPrompt = `You are an Analyzer Agent in a multi-agent workflow.

Your task: Analyze ${totalOpportunities} business opportunities to tag them with AI, Analytics, or Data categories.

Analysis criteria:
- AI: Machine Learning, NLP, Computer Vision, Generative AI, Chatbots
- Analytics: Business Intelligence, Dashboards, Reporting, Predictive Analytics
- Data: Data Engineering, ETL, Data Lakes, Data Warehouses, Data Migration

${state.customInstructions && state.customInstructions.length > 0 ? `
Custom rules provided: ${state.customInstructions.length} additional tagging instructions
` : ''}

Your approach:
1. Process each opportunity sequentially (no parallelization)
2. Analyze the opportunity name for keywords and context
3. Apply custom rules if provided
4. Provide detailed rationale for each decision
5. Report progress after each opportunity
6. Communicate results back to Orchestrator

Describe your analysis strategy in 2-3 sentences.`

    const reasoningResponse = await llm.invoke([new HumanMessage(reasoningPrompt)])
    
    // Add agent's reasoning to messages
    let messages = [
      ...state.messages,
      new HumanMessage(`FilterAgent → AnalyzerAgent: Here are ${totalOpportunities} opportunities for AI tagging analysis.`),
      new AIMessage(`AnalyzerAgent: ${reasoningResponse.content}`),
    ]

    // Process opportunities SEQUENTIALLY
    const analyzedOpportunities: AnalyzedOpportunity[] = []
    const progressUpdates = [...state.progressUpdates]

    for (let i = 0; i < state.filteredOpportunities.length; i++) {
      const opp = state.filteredOpportunities[i]
      const current = i + 1

      // Log processing this specific opportunity
      agentLogs.push({
        agent: 'AnalyzerAgent',
        action: `Analyzing opportunity ${current}/${totalOpportunities}: "${opp.opportunityName.substring(0, 60)}${opp.opportunityName.length > 60 ? '...' : ''}"`,
        status: 'active',
        timestamp: new Date().toISOString(),
      })

      // Add "waiting for AI" message before analysis
      agentLogs.push({
        agent: 'AnalyzerAgent',
        action: `⏳ Waiting for AI analysis of "${opp.opportunityName.substring(0, 50)}${opp.opportunityName.length > 50 ? '...' : ''}"`,
        status: 'active',
        timestamp: new Date().toISOString(),
      })

      // Stream the waiting message immediately
      if (onUpdate) {
        onUpdate({
          agentLogs: [...agentLogs],
          progressUpdates: [...progressUpdates],
          analyzedOpportunities: [...analyzedOpportunities],
          currentStep: 'analyzing',
        })
      }

      try {
        // Analyze this opportunity using OpenAI with retry logic
        let analyzed: AnalyzedOpportunity
        let retries = 0
        const maxRetries = 3
        
        while (retries < maxRetries) {
          try {
            analyzed = await analyzeOpportunity(opp, state.customInstructions)
            break // Success, exit retry loop
          } catch (error: any) {
            retries++
            if (retries >= maxRetries) {
              // Max retries reached, log error and create a fallback result
              console.error(`Failed to analyze opportunity ${opp.id} after ${maxRetries} retries:`, error)
              agentLogs.push({
                agent: 'AnalyzerAgent',
                action: `❌ Failed to analyze "${opp.opportunityName.substring(0, 40)}..." after ${maxRetries} attempts. Continuing with next opportunity. Error: ${error.message}`,
                status: 'error',
                timestamp: new Date().toISOString(),
              })
              
              // Stream error message immediately
              if (onUpdate) {
                onUpdate({
                  agentLogs: [...agentLogs],
                  progressUpdates: [...progressUpdates],
                  analyzedOpportunities: [...analyzedOpportunities],
                  currentStep: 'analyzing',
                })
              }
              
              // Create fallback result
              analyzed = {
                ...opp,
                tags: [],
                rationale: `Analysis failed after ${maxRetries} retries: ${error.message}`,
                confidence: 0,
              }
              break
            }
            // Wait before retry (exponential backoff)
            const waitTime = Math.pow(2, retries)
            agentLogs.push({
              agent: 'AnalyzerAgent',
              action: `⚠️ Retry ${retries}/${maxRetries} for "${opp.opportunityName.substring(0, 40)}..." - waiting ${waitTime}s before retry. Error: ${error.message}`,
              status: 'active',
              timestamp: new Date().toISOString(),
            })
            
            // Stream retry message immediately
            if (onUpdate) {
              onUpdate({
                agentLogs: [...agentLogs],
                progressUpdates: [...progressUpdates],
                analyzedOpportunities: [...analyzedOpportunities],
                currentStep: 'analyzing',
              })
            }
            
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
          }
        }
        
        analyzedOpportunities.push(analyzed!)
        
        // Log continuation message
        agentLogs.push({
          agent: 'AnalyzerAgent',
          action: `➡️ Continuing with next opportunity (${current + 1}/${totalOpportunities})`,
          status: 'active',
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        // Catastrophic error - log and continue with next opportunity
        console.error(`Critical error analyzing opportunity ${opp.id}:`, error)
        agentLogs.push({
          agent: 'AnalyzerAgent',
          action: `❌ Critical error for "${opp.opportunityName.substring(0, 40)}...": ${error.message}. Continuing with next opportunity.`,
          status: 'error',
          timestamp: new Date().toISOString(),
        })
        
        // Stream error message immediately
        if (onUpdate) {
          onUpdate({
            agentLogs: [...agentLogs],
            progressUpdates: [...progressUpdates],
            analyzedOpportunities: [...analyzedOpportunities],
            currentStep: 'analyzing',
          })
        }
        
        // Add a placeholder result so we don't lose track
        analyzedOpportunities.push({
          ...opp,
          tags: [],
          rationale: `Critical error during analysis: ${error.message}`,
          confidence: 0,
        })
      }

      // Log result with details
      const lastAnalyzed = analyzedOpportunities[analyzedOpportunities.length - 1]
      if (lastAnalyzed) {
        const tags = lastAnalyzed.tags.length > 0 ? lastAnalyzed.tags.join(', ') : 'None'
        const shortRationale = lastAnalyzed.rationale.substring(0, 100).replace(/\n/g, ' ')
        
        agentLogs.push({
          agent: 'AnalyzerAgent',
          action: `✓ Completed: "${lastAnalyzed.opportunityName.substring(0, 40)}..." → Tagged: [${tags}] (${lastAnalyzed.confidence}% confidence). Rationale: ${shortRationale}...`,
          status: 'complete',
          timestamp: new Date().toISOString(),
          details: {
            opportunityId: lastAnalyzed.id,
            tags: lastAnalyzed.tags,
            confidence: lastAnalyzed.confidence,
            rationale: lastAnalyzed.rationale,
          },
        })

        // Progress update
        progressUpdates.push({
          current,
          total: totalOpportunities,
          currentOpp: lastAnalyzed.opportunityName,
          timestamp: new Date().toISOString(),
        })
      }

      // Stream real-time update to frontend
      if (onUpdate) {
        onUpdate({
          agentLogs: [...agentLogs],
          progressUpdates: [...progressUpdates],
          analyzedOpportunities: [...analyzedOpportunities],
          currentStep: 'analyzing',
        })
      }

      // Inter-agent message every 5 opportunities
      if (current % 5 === 0 || current === totalOpportunities) {
        const taggedSoFar = analyzedOpportunities.filter(a => a.tags.length > 0).length
        messages.push(
          new AIMessage(
            `AnalyzerAgent → Orchestrator: Progress update - ${current}/${totalOpportunities} analyzed. ${taggedSoFar} opportunities tagged so far.`
          )
        )
      }
    }

    // Final summary with success/failure breakdown
    const aiCount = analyzedOpportunities.filter(a => a.tags.includes('AI')).length
    const analyticsCount = analyzedOpportunities.filter(a => a.tags.includes('Analytics')).length
    const dataCount = analyzedOpportunities.filter(a => a.tags.includes('Data')).length
    const taggedCount = analyzedOpportunities.filter(a => a.tags.length > 0).length
    const failedCount = analyzedOpportunities.filter(a => 
      a.rationale && (a.rationale.includes('failed') || a.rationale.includes('error') || a.rationale.includes('Critical error'))
    ).length
    const successCount = totalOpportunities - failedCount

    let summaryAction = `✅ Analysis complete: ${successCount}/${totalOpportunities} opportunities analyzed successfully.`
    if (failedCount > 0) {
      summaryAction += ` ⚠️ ${failedCount} failed (continued with analysis).`
    }
    summaryAction += ` Tags: AI=${aiCount}, Analytics=${analyticsCount}, Data=${dataCount}, Untagged=${totalOpportunities - taggedCount}.`

    agentLogs.push({
      agent: 'AnalyzerAgent',
      action: summaryAction,
      status: failedCount > 0 ? 'active' : 'complete',
      timestamp: new Date().toISOString(),
      details: {
        total: totalOpportunities,
        successful: successCount,
        failed: failedCount,
        tagged: taggedCount,
        aiCount,
        analyticsCount,
        dataCount,
        untagged: totalOpportunities - taggedCount,
      },
    })

    // Final message to Orchestrator
    messages.push(
      new AIMessage(
        `AnalyzerAgent → Orchestrator: Analysis complete! Processed ${totalOpportunities} opportunities. ${taggedCount} were tagged (AI: ${aiCount}, Analytics: ${analyticsCount}, Data: ${dataCount}). Ready for export.`
      )
    )

    return {
      analyzedOpportunities,
      totalProcessed: totalOpportunities,
      currentStep: 'analysis_complete',
      messages,
      agentLogs,
      progressUpdates,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    agentLogs.push({
      agent: 'AnalyzerAgent',
      action: `Error during analysis: ${errorMsg}`,
      status: 'error',
      timestamp: new Date().toISOString(),
    })

    return {
      currentStep: 'error',
      errors: [...state.errors, `AnalyzerAgent: ${errorMsg}`],
      agentLogs,
    }
  }
}

