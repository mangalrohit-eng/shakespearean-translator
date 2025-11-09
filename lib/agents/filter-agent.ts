import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'
import { filterCommsMedia } from '../excel/reader'

/**
 * Filter Agent
 * Uses LLM to reason about filtering criteria and delegates filtering to tool
 */
export async function filterAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
  })

  // Log agent start
  const agentLogs = [
    ...state.agentLogs,
    {
      agent: 'FilterAgent',
      action: `Analyzing ${state.rawData.length} opportunities for US-Comms & Media filter`,
      status: 'active' as const,
      timestamp: new Date().toISOString(),
    },
  ]

  try {
    // Agent reasoning: Understand filtering task
    const reasoningPrompt = `You are a Filter Agent in a multi-agent workflow.

Your task: Filter opportunities to identify only those in the US Communications & Media industry.

Current data:
- Total opportunities: ${state.rawData.length}
- Filter criteria: Client Group must contain "US-Comms & Media" or "Comms & Media"

Your reasoning:
1. Understand the filtering criteria
2. Apply the filter using your tool
3. Report statistics about filtered data
4. Send filtered results to the Analyzer Agent

Reason through this task and describe your filtering strategy in 2-3 sentences.`

    const reasoningResponse = await llm.invoke([new HumanMessage(reasoningPrompt)])
    
    // Add agent's reasoning to messages
    const messages = [
      ...state.messages,
      new HumanMessage(`ExcelReaderAgent → FilterAgent: I have ${state.rawData.length} opportunities ready. Please filter for US-Comms & Media.`),
      new AIMessage(`FilterAgent: ${reasoningResponse.content}`),
    ]

    // Execute the tool (actual filtering)
    const filteredOpportunities = filterCommsMedia(state.rawData)

    // Get sample opportunity names for detailed reporting
    const sampleOpps = filteredOpportunities
      .slice(0, 3)
      .map(o => `"${o.oppName}"`)
      .join(', ')

    // Log completion with details
    agentLogs.push({
      agent: 'FilterAgent',
      action: `Filtering complete: ${filteredOpportunities.length} Comms & Media opportunities identified out of ${state.rawData.length} total. Sample: ${sampleOpps}${filteredOpportunities.length > 3 ? '...' : ''}`,
      status: 'complete',
      timestamp: new Date().toISOString(),
      details: {
        totalInput: state.rawData.length,
        totalFiltered: filteredOpportunities.length,
        filterRate: `${Math.round((filteredOpportunities.length / state.rawData.length) * 100)}%`,
        samples: filteredOpportunities.slice(0, 5).map(o => o.oppName),
      },
    })

    // Communicate results to next agent
    messages.push(
      new AIMessage(
        `FilterAgent → AnalyzerAgent: Filtering complete. I found ${filteredOpportunities.length} Comms & Media opportunities ready for AI analysis. Samples include ${sampleOpps}${filteredOpportunities.length > 3 ? ' and more' : ''}.`
      )
    )

    return {
      filteredOpportunities,
      currentStep: 'filter_complete',
      messages,
      agentLogs,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    agentLogs.push({
      agent: 'FilterAgent',
      action: `Error filtering: ${errorMsg}`,
      status: 'error',
      timestamp: new Date().toISOString(),
    })

    return {
      currentStep: 'error',
      errors: [...state.errors, `FilterAgent: ${errorMsg}`],
      agentLogs,
    }
  }
}

