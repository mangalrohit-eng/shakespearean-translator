import { WorkflowState, createInitialState } from './state'
import { excelReaderAgent } from './excel-reader-agent'
import { filterAgent } from './filter-agent'
import { analyzerAgent } from './analyzer-agent'

/**
 * Simple sequential workflow execution without LangGraph complexity
 * Executes agents in order with state management and conditional flow
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
    // Step 1: Excel Reader Agent
    const excelResult = await excelReaderAgent(state)
    state = { ...state, ...excelResult }
    if (onUpdate) onUpdate(state)

    // Check if we should continue
    if (state.errors.length > 0 || state.rawData.length === 0) {
      return state
    }

    // Step 2: Filter Agent
    const filterResult = await filterAgent(state)
    state = { ...state, ...filterResult }
    if (onUpdate) onUpdate(state)

    // Check if we should continue
    if (state.errors.length > 0 || state.filteredOpportunities.length === 0) {
      return state
    }

    // Step 3: Analyzer Agent
    const analyzerResult = await analyzerAgent(state)
    state = { ...state, ...analyzerResult }
    if (onUpdate) onUpdate(state)

    return state
  } catch (error) {
    state.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return state
  }
}

