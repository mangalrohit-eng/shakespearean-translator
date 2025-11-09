import { StateGraph, END, MemorySaver, Annotation } from '@langchain/langgraph'
import { WorkflowState, createInitialState } from './state'
import { excelReaderAgent } from './excel-reader-agent'
import { filterAgent } from './filter-agent'
import { analyzerAgent } from './analyzer-agent'

/**
 * Conditional routing functions
 * Determine which node to execute next based on current state
 */

function shouldContinueAfterExcelRead(state: WorkflowState): typeof END | 'filter' {
  // If errors occurred, end the workflow
  if (state.errors && state.errors.length > 0) {
    return END
  }
  
  // If no data was extracted, end
  if (!state.rawData || state.rawData.length === 0) {
    return END
  }
  
  // Otherwise, proceed to filtering
  return 'filter'
}

function shouldContinueAfterFilter(state: WorkflowState): typeof END | 'analyzer' {
  // If errors occurred, end the workflow
  if (state.errors && state.errors.length > 0) {
    return END
  }
  
  // If no opportunities found after filtering, end
  if (!state.filteredOpportunities || state.filteredOpportunities.length === 0) {
    return END
  }
  
  // Otherwise, proceed to analysis
  return 'analyzer'
}

function shouldContinueAfterAnalyzer(state: WorkflowState): typeof END {
  // After analysis, always end (for now)
  // Could extend to add export agent here
  return END
}

// Define state annotation for LangGraph
const StateAnnotation = Annotation.Root({
  fileBuffer: Annotation<ArrayBuffer | undefined>,
  customInstructions: Annotation<any[] | undefined>,
  rawData: Annotation<any[]>,
  filteredOpportunities: Annotation<any[]>,
  analyzedOpportunities: Annotation<any[]>,
  currentStep: Annotation<string>,
  totalProcessed: Annotation<number>,
  errors: Annotation<string[]>,
  messages: Annotation<any[]>,
  progressUpdates: Annotation<any[]>,
  agentLogs: Annotation<any[]>,
})

/**
 * Create the StateGraph workflow
 * This defines the multi-agent workflow with conditional routing
 */
export function createWorkflowGraph() {
  // Create the graph with state annotation
  const workflow = new StateGraph(StateAnnotation)

  // Add agent nodes
  workflow.addNode('excelReader', excelReaderAgent)
  workflow.addNode('filter', filterAgent)
  workflow.addNode('analyzer', analyzerAgent)

  // Set entry point - first node to execute
  workflow.setEntryPoint('excelReader')

  // Add conditional edges (routing)
  workflow.addConditionalEdges('excelReader', shouldContinueAfterExcelRead)

  workflow.addConditionalEdges('filter', shouldContinueAfterFilter)

  workflow.addConditionalEdges('analyzer', shouldContinueAfterAnalyzer)

  return workflow
}

/**
 * Compile the workflow with memory/checkpointing
 * Allows workflow to be resumed if interrupted
 */
export function compileWorkflow() {
  const workflow = createWorkflowGraph()
  const checkpointer = new MemorySaver()
  
  // Compile with checkpointing enabled
  const app = workflow.compile({
    checkpointer,
  })
  
  return app
}

/**
 * Execute the workflow with streaming support
 * This is the main entry point for running the multi-agent system
 */
export async function executeWorkflow(
  fileBuffer: ArrayBuffer,
  customInstructions?: any[],
  onUpdate?: (state: WorkflowState) => void
) {
  const app = compileWorkflow()
  
  // Create initial state
  const initialState = createInitialState()
  initialState.fileBuffer = fileBuffer
  initialState.customInstructions = customInstructions
  
  // Configuration for execution with checkpointing
  const config = {
    configurable: {
      thread_id: `workflow-${Date.now()}`, // Unique thread ID for this execution
    },
  }
  
  // Stream the workflow execution
  const stream = await app.stream(initialState, config)
  
  let finalState: WorkflowState = initialState
  
  for await (const output of stream) {
    // Get the latest state from the output
    const nodeNames = Object.keys(output)
    if (nodeNames.length > 0) {
      const nodeName = nodeNames[0]
      const nodeOutput = output[nodeName]
      
      // Merge the output into final state
      finalState = {
        ...finalState,
        ...nodeOutput,
      }
      
      // Call callback with updated state
      if (onUpdate) {
        onUpdate(finalState)
      }
    }
  }
  
  return finalState
}

