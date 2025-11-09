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
export async function analyzerAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
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

      // Analyze this opportunity using OpenAI
      const analyzed = await analyzeOpportunity(opp, state.customInstructions)
      analyzedOpportunities.push(analyzed)

      // Log result with details
      const tags = analyzed.tags.length > 0 ? analyzed.tags.join(', ') : 'None'
      const shortRationale = analyzed.rationale.substring(0, 100).replace(/\n/g, ' ')
      
      agentLogs.push({
        agent: 'AnalyzerAgent',
        action: `✓ Completed: "${analyzed.opportunityName.substring(0, 40)}..." → Tagged: [${tags}] (${analyzed.confidence}% confidence). Rationale: ${shortRationale}...`,
        status: 'complete',
        timestamp: new Date().toISOString(),
        details: {
          opportunityId: analyzed.id,
          tags: analyzed.tags,
          confidence: analyzed.confidence,
          rationale: analyzed.rationale,
        },
      })

      // Progress update
      progressUpdates.push({
        current,
        total: totalOpportunities,
        currentOpp: analyzed.opportunityName,
        timestamp: new Date().toISOString(),
      })

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

    // Final summary
    const aiCount = analyzedOpportunities.filter(a => a.tags.includes('AI')).length
    const analyticsCount = analyzedOpportunities.filter(a => a.tags.includes('Analytics')).length
    const dataCount = analyzedOpportunities.filter(a => a.tags.includes('Data')).length
    const taggedCount = analyzedOpportunities.filter(a => a.tags.length > 0).length

    agentLogs.push({
      agent: 'AnalyzerAgent',
      action: `Analysis complete: ${taggedCount}/${totalOpportunities} opportunities tagged. Breakdown: AI=${aiCount}, Analytics=${analyticsCount}, Data=${dataCount}. Sending results to Orchestrator.`,
      status: 'complete',
      timestamp: new Date().toISOString(),
      details: {
        total: totalOpportunities,
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

