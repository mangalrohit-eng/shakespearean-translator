import { StateGraph, END, MemorySaver } from '@langchain/langgraph'
import { WorkflowState, createInitialState } from './state'
import { excelReaderAgent } from './excel-reader-agent'
import { filterAgent } from './filter-agent'
import { analyzerAgent } from './analyzer-agent'

/**
 * Conditional routing functions
 * Determine which node to execute next based on current state
 */

function shouldContinueAfterExcelRead(state: WorkflowState): string {
  // If errors occurred, end the workflow
  if (state.errors.length > 0) {
    return END
  }
  
  // If no data was extracted, end
  if (state.rawData.length === 0) {
    return END
  }
  
  // Otherwise, proceed to filtering
  return 'filter'
}

function shouldContinueAfterFilter(state: WorkflowState): string {
  // If errors occurred, end the workflow
  if (state.errors.length > 0) {
    return END
  }
  
  // If no opportunities found after filtering, end
  if (state.filteredOpportunities.length === 0) {
    return END
  }
  
  // Otherwise, proceed to analysis
  return 'analyzer'
}

function shouldContinueAfterAnalyzer(state: WorkflowState): string {
  // After analysis, always end (for now)
  // Could extend to add export agent here
  return END
}

/**
 * Create the StateGraph workflow
 * This defines the multi-agent workflow with conditional routing
 */
export function createWorkflowGraph() {
  // Create the graph with our state schema
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      fileBuffer: {
        value: (x?: ArrayBuffer, y?: ArrayBuffer) => y ?? x,
        default: () => undefined,
      },
      customInstructions: {
        value: (x?: any[], y?: any[]) => y ?? x,
        default: () => undefined,
      },
      rawData: {
        value: (x: any[], y?: any[]) => y ?? x,
        default: () => [],
      },
      filteredOpportunities: {
        value: (x: any[], y?: any[]) => y ?? x,
        default: () => [],
      },
      analyzedOpportunities: {
        value: (x: any[], y?: any[]) => y ?? x,
        default: () => [],
      },
      currentStep: {
        value: (x: string, y?: string) => y ?? x,
        default: () => 'start',
      },
      totalProcessed: {
        value: (x: number, y?: number) => y ?? x,
        default: () => 0,
      },
      errors: {
        value: (x: string[], y?: string[]) => [...x, ...(y || [])],
        default: () => [],
      },
      messages: {
        value: (x: any[], y?: any[]) => [...x, ...(y || [])],
        default: () => [],
      },
      progressUpdates: {
        value: (x: any[], y?: any[]) => [...x, ...(y || [])],
        default: () => [],
      },
      agentLogs: {
        value: (x: any[], y?: any[]) => [...x, ...(y || [])],
        default: () => [],
      },
    },
  })

  // Add agent nodes
  workflow.addNode('excelReader', excelReaderAgent)
  workflow.addNode('filter', filterAgent)
  workflow.addNode('analyzer', analyzerAgent)

  // Set entry point
  workflow.setEntryPoint('excelReader')

  // Add conditional edges (routing)
  workflow.addConditionalEdges('excelReader', shouldContinueAfterExcelRead, {
    filter: 'filter',
    [END]: END,
  })

  workflow.addConditionalEdges('filter', shouldContinueAfterFilter, {
    analyzer: 'analyzer',
    [END]: END,
  })

  workflow.addConditionalEdges('analyzer', shouldContinueAfterAnalyzer, {
    [END]: END,
  })

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

