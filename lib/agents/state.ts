import { BaseMessage } from '@langchain/core/messages'
import { ExcelRow, Opportunity, AnalyzedOpportunity, CustomInstruction } from '../types'

/**
 * State schema for the LangGraph workflow
 * This state is passed between all agents and maintains the workflow context
 */
export interface WorkflowState {
  // Input
  fileBuffer?: ArrayBuffer
  customInstructions?: CustomInstruction[]
  
  // Data at various stages
  rawData: ExcelRow[]
  filteredOpportunities: Opportunity[]
  analyzedOpportunities: AnalyzedOpportunity[]
  
  // Workflow control
  currentStep: string
  totalProcessed: number
  errors: string[]
  
  // Agent communication (inter-agent messages)
  messages: BaseMessage[]
  
  // Progress tracking for streaming
  progressUpdates: Array<{
    current: number
    total: number
    currentOpp: string
    timestamp: string
  }>
  
  // Agent activity logs
  agentLogs: Array<{
    agent: string
    action: string
    status: 'active' | 'complete' | 'error'
    timestamp: string
    details?: any
  }>
}

/**
 * Initial state for the workflow
 */
export function createInitialState(): WorkflowState {
  return {
    rawData: [],
    filteredOpportunities: [],
    analyzedOpportunities: [],
    currentStep: 'start',
    totalProcessed: 0,
    errors: [],
    messages: [],
    progressUpdates: [],
    agentLogs: [],
  }
}

/**
 * State update helper - returns new state with updates
 */
export function updateState(
  state: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  return {
    ...state,
    ...updates,
  }
}

