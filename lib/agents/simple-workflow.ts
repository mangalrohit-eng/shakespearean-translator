import { WorkflowState, createInitialState } from './state'
import { orchestratorAgent } from './orchestrator-agent'
import { excelReaderAgent } from './excel-reader-agent'
import { excelParserAgent } from './excel-parser-agent'
import { analyzerAgent } from './analyzer-agent'
import { emailComposerAgent } from './email-composer-agent'

/**
 * LangGraph-style multi-agent workflow with intelligent Orchestrator
 * Orchestrator makes routing decisions using LLM reasoning
 */
export async function executeSimpleWorkflow(
  fileBuffer: ArrayBuffer,
  customInstructions?: any[],
  onUpdate?: (state: WorkflowState) => void
): Promise<WorkflowState> {
  // Initialize state
  let state: WorkflowState = createInitialState()
  state.fileBuffer = fileBuffer
  state.customInstructions = customInstructions

  try {
    // Step 1: Orchestrator initializes workflow
    const initResult = await orchestratorAgent(state, 'initialize')
    state = { ...state, ...initResult }
    if (onUpdate) onUpdate(state)

    // Step 2: Excel Reader Agent
    const excelResult = await excelReaderAgent(state)
    state = { ...state, ...excelResult }
    if (onUpdate) onUpdate(state)

    // Step 3: Orchestrator reviews Excel results and decides routing
    const afterExcelResult = await orchestratorAgent(state, 'after_excel')
    state = { ...state, ...afterExcelResult }
    if (onUpdate) onUpdate(state)

    // Check if orchestrator decided to stop
    if (state.errors.length > 0 || state.rawData.length === 0) {
      return state
    }

    // Step 4: Excel Parser Agent - Intelligently parse columns and structure data
    const parserResult = await excelParserAgent(state, (log) => {
      // Pass through agent logs for real-time updates
      if (onUpdate) {
        const updatedState = {
          ...state,
          agentLogs: [
            ...(state.agentLogs || []),
            {
              agent: log.agent,
              action: log.action,
              status: log.status,
              timestamp: new Date().toISOString(),
              details: log.details
            }
          ]
        }
        onUpdate(updatedState)
      }
    })
    state = { ...state, ...parserResult }
    if (onUpdate) onUpdate(state)

    // Step 5: Orchestrator reviews Parser results and decides routing
    const afterParserResult = await orchestratorAgent(state, 'after_parser')
    state = { ...state, ...afterParserResult }
    if (onUpdate) onUpdate(state)

    // Check if orchestrator decided to stop
    if (state.errors.length > 0 || state.filteredOpportunities.length === 0) {
      return state
    }

    // Step 6: Analyzer Agent - with real-time streaming
    const analyzerResult = await analyzerAgent(state, (partialState) => {
      // Stream partial results as each opportunity is analyzed
      if (onUpdate) {
        const updatedState = {
          ...state,
          ...partialState
        }
        onUpdate(updatedState)
      }
    })
    state = { ...state, ...analyzerResult }
    if (onUpdate) onUpdate(state)

    // Step 7: Email Composer Agent - Generate personalized emails for D&AI captains
    const emailResult = await emailComposerAgent(state, (log) => {
      // Pass through agent logs for real-time updates
      if (onUpdate) {
        const updatedState = {
          ...state,
          agentLogs: [
            ...(state.agentLogs || []),
            {
              agent: log.agent,
              action: log.action,
              status: log.status,
              timestamp: new Date().toISOString(),
              details: log.details
            }
          ]
        }
        onUpdate(updatedState)
      }
    })
    state = { ...state, ...emailResult }
    if (onUpdate) onUpdate(state)

    // Step 8: Orchestrator reviews final results
    const afterAnalyzerResult = await orchestratorAgent(state, 'after_analyzer')
    state = { ...state, ...afterAnalyzerResult }
    if (onUpdate) onUpdate(state)

    return state
  } catch (error) {
    state.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return state
  }
}

