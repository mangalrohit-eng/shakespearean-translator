import { WorkflowState, createInitialState } from './state'
import { orchestratorAgent } from './orchestrator-agent'
import { excelReaderAgent } from './excel-reader-agent'
import { filterAgent } from './filter-agent'
import { analyzerAgent } from './analyzer-agent'

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

    // Step 4: Filter Agent
    const filterResult = await filterAgent(state)
    state = { ...state, ...filterResult }
    if (onUpdate) onUpdate(state)

    // Step 5: Orchestrator reviews Filter results and decides routing
    const afterFilterResult = await orchestratorAgent(state, 'after_filter')
    state = { ...state, ...afterFilterResult }
    if (onUpdate) onUpdate(state)

    // Check if orchestrator decided to stop
    if (state.errors.length > 0 || state.filteredOpportunities.length === 0) {
      return state
    }

    // Step 6: Analyzer Agent
    const analyzerResult = await analyzerAgent(state)
    state = { ...state, ...analyzerResult }
    if (onUpdate) onUpdate(state)

    // Step 7: Orchestrator reviews final results
    const afterAnalyzerResult = await orchestratorAgent(state, 'after_analyzer')
    state = { ...state, ...afterAnalyzerResult }
    if (onUpdate) onUpdate(state)

    return state
  } catch (error) {
    state.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return state
  }
}

