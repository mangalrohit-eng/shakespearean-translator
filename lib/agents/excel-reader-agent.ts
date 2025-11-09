import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'
import { parseExcelFile } from '../excel/reader'

/**
 * Excel Reader Agent
 * Uses LLM to reason about Excel file structure and delegates parsing to tool
 */
export async function excelReaderAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
  })

  // Log agent start
  const agentLogs = [
    ...state.agentLogs,
    {
      agent: 'ExcelReaderAgent',
      action: 'Analyzing uploaded Excel file structure',
      status: 'active' as const,
      timestamp: new Date().toISOString(),
      details: 'Initializing Excel parser. Validating file buffer presence and preparing to extract opportunity data from spreadsheet.',
    },
  ]

  try {
    // Agent reasoning: Understand what needs to be done
    const reasoningPrompt = `You are an Excel Reader Agent in a multi-agent workflow.
    
Your task: Parse an uploaded Excel file and extract opportunity data.

The Excel file should contain columns like:
- ID, Client Name, Opp Name, Client Group, Deal Size, Total, etc.

Your reasoning:
1. Validate the file buffer is present
2. Parse the Excel file using your tool
3. Verify the required columns exist
4. Report back to the Orchestrator with results

Current state: File buffer ${state.fileBuffer ? 'is present' : 'is missing'}

Reason through this task and describe your approach in 2-3 sentences.`

    const reasoningResponse = await llm.invoke([new HumanMessage(reasoningPrompt)])
    
    // Add agent's reasoning to messages
    const messages = [
      ...state.messages,
      new HumanMessage(`Orchestrator: Please parse the uploaded Excel file and extract all opportunities.`),
      new AIMessage(`ExcelReaderAgent: ${reasoningResponse.content}`),
    ]

    // Execute the tool (actual parsing)
    if (!state.fileBuffer) {
      throw new Error('No file buffer provided')
    }

    const rawData = parseExcelFile(state.fileBuffer)

    // Log completion with details
    const sampleColumns = rawData.length > 0 ? Object.keys(rawData[0]).slice(0, 5).join(', ') : 'None'
    agentLogs.push({
      agent: 'ExcelReaderAgent',
      action: `Successfully parsed Excel file - ${rawData.length} rows extracted`,
      status: 'complete',
      timestamp: new Date().toISOString(),
      details: `Tool Execution: parseExcelFile() completed. Data Structure Validated: ${sampleColumns}... | LLM Reasoning: ${reasoningResponse.content.toString().substring(0, 150)}... | Next: Sending ${rawData.length} rows to Orchestrator for routing decision.`,
    })

    // Communicate results back to workflow
    messages.push(
      new AIMessage(
        `ExcelReaderAgent → Orchestrator: Parsing complete. Extracted ${rawData.length} rows. Ready for filtering.`
      )
    )

    return {
      rawData,
      currentStep: 'excel_read_complete',
      messages,
      agentLogs,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    agentLogs.push({
      agent: 'ExcelReaderAgent',
      action: `Error parsing Excel: ${errorMsg}`,
      status: 'error',
      timestamp: new Date().toISOString(),
    })

    return {
      currentStep: 'error',
      errors: [...state.errors, `ExcelReaderAgent: ${errorMsg}`],
      agentLogs,
    }
  }
}

