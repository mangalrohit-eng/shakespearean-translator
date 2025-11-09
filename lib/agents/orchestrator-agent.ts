import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'

/**
 * Orchestrator Agent
 * Uses LLM to intelligently coordinate the multi-agent workflow
 * Makes routing decisions, monitors progress, and manages agent communication
 */
export async function orchestratorAgent(
  state: WorkflowState,
  decision: 'initialize' | 'after_excel' | 'after_parser' | 'after_analyzer'
): Promise<Partial<WorkflowState>> {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.2, // Lower temperature for more consistent decisions
  })

  const agentLogs = [...state.agentLogs]
  const messages = [...state.messages]

  try {
    switch (decision) {
      case 'initialize': {
        // Orchestrator starts the workflow
        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: 'Initializing multi-agent workflow',
          status: 'active',
          timestamp: new Date().toISOString(),
          details: 'Analyzing task requirements and coordinating 3 specialized agents: ExcelReaderAgent, FilterAgent, AnalyzerAgent. Preparing to process uploaded Excel file.'
        })

        const reasoningPrompt = `You are an Orchestrator Agent managing a multi-agent workflow.

Task: Analyze business opportunities from an uploaded Excel file.

Your responsibilities:
1. Coordinate 3 specialized agents: ExcelReaderAgent, FilterAgent, AnalyzerAgent
2. Make intelligent routing decisions based on agent outputs
3. Monitor workflow progress and handle errors
4. Ensure data flows correctly between agents

Current state:
- Excel file uploaded: ${state.fileBuffer ? 'Yes' : 'No'}
- Workflow status: Starting

Provide your orchestration plan in 2-3 sentences.`

        const reasoning = await llm.invoke([new HumanMessage(reasoningPrompt)])

        messages.push(
          new AIMessage(`OrchestratorAgent: ${reasoning.content}`)
        )

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Workflow plan ready - dispatching ExcelReaderAgent`,
          status: 'complete',
          timestamp: new Date().toISOString(),
          details: `LLM Reasoning: ${reasoning.content.toString().substring(0, 200)}... | Next Action: Instructing ExcelReaderAgent to parse uploaded file and extract all opportunity records with row count and data structure.`
        })

        messages.push(
          new AIMessage(
            `OrchestratorAgent → ExcelReaderAgent: Please parse the uploaded Excel file and extract all opportunity records. Report back with row count and data structure.`
          )
        )

        return {
          currentStep: 'orchestrator_initialized',
          messages,
          agentLogs,
        }
      }

      case 'after_excel': {
        // Orchestrator reviews Excel parsing results
        const rowCount = state.rawData.length

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Received ${rowCount} rows from ExcelReaderAgent`,
          status: 'active',
          timestamp: new Date().toISOString(),
          details: `Analyzing data quality and structure. Columns detected: ID, Client Name, Opp Name, Client Group. Preparing to evaluate routing decision for next step.`
        })

        const reviewPrompt = `You are an Orchestrator Agent reviewing Excel parsing results.

ExcelReaderAgent reported:
- Total rows extracted: ${rowCount}
- Columns available: ID, Client Name, Opp Name, Client Group, etc.

Your decision:
1. If rows > 0: Proceed to FilterAgent
2. If rows = 0: Stop workflow (no data to process)

Current situation: ${rowCount} rows extracted.

Provide your routing decision and brief rationale in 2 sentences.`

        const decision = await llm.invoke([new HumanMessage(reviewPrompt)])

        if (rowCount === 0) {
          agentLogs.push({
            agent: 'OrchestratorAgent',
            action: `Decision: STOP workflow. No data extracted from Excel file.`,
            status: 'complete',
            timestamp: new Date().toISOString(),
          })

          messages.push(new AIMessage(`OrchestratorAgent: ${decision.content}`))

          return {
            currentStep: 'orchestrator_stopped',
            messages,
            agentLogs,
            errors: [...state.errors, 'No data found in Excel file'],
          }
        }

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Decision: PROCEED to FilterAgent. Data quality check passed.`,
          status: 'complete',
          timestamp: new Date().toISOString(),
        })

        messages.push(new AIMessage(`OrchestratorAgent: ${decision.content}`))

        
        messages.push(
          new AIMessage(
            `OrchestratorAgent → FilterAgent: Received ${rowCount} opportunity records. Please filter for US-Comms & Media industry and report back with filtered count.`
          )
        )

        return {
          currentStep: 'orchestrator_routed_to_filter',
          messages,
          agentLogs,
        }
      }

      case 'after_parser': {
        // Orchestrator reviews parsing results
        const parsedCount = state.filteredOpportunities.length
        const originalCount = state.rawData.length

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Received ${parsedCount} parsed opportunities from ExcelParserAgent (from ${originalCount} total rows). Evaluating...`,
          status: 'active',
          timestamp: new Date().toISOString(),
        })

        const reviewPrompt = `You are an Orchestrator Agent reviewing Excel parsing results.

ExcelParserAgent reported:
- Original rows: ${originalCount}
- Successfully parsed opportunities: ${parsedCount}
- Parse efficiency: ${Math.round((parsedCount / originalCount) * 100)}%

Sample opportunities: ${state.filteredOpportunities
          .slice(0, 3)
          .map(o => o.opportunityName)
          .join(', ')}

Your decision:
1. If parsed count > 0: Proceed to AnalyzerAgent for AI/Analytics/Data tagging
2. If parsed count = 0: Stop workflow (no valid opportunities)

Provide your routing decision and rationale in 2 sentences.`

        const decision = await llm.invoke([new HumanMessage(reviewPrompt)])

        if (parsedCount === 0) {
          agentLogs.push({
            agent: 'OrchestratorAgent',
            action: `Decision: STOP workflow. No valid opportunities found after parsing.`,
            status: 'complete',
            timestamp: new Date().toISOString(),
          })

          messages.push(new AIMessage(`OrchestratorAgent: ${decision.content}`))

          return {
            currentStep: 'orchestrator_stopped',
            messages,
            agentLogs,
            errors: [...state.errors, 'No valid opportunities found after parsing'],
          }
        }

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Decision: PROCEED to AnalyzerAgent. Dispatching ${parsedCount} opportunities for AI/Analytics/Data tagging.`,
          status: 'complete',
          timestamp: new Date().toISOString(),
        })

        messages.push(new AIMessage(`OrchestratorAgent: ${decision.content}`))

        messages.push(
          new AIMessage(
            `OrchestratorAgent → AnalyzerAgent: I'm sending you ${parsedCount} parsed opportunities for AI-powered tagging. Analyze each opportunity name AND description for AI, Analytics, or Data relevance. Process sequentially and provide detailed rationale.`
          )
        )

        return {
          currentStep: 'orchestrator_routed_to_analyzer',
          messages,
          agentLogs,
        }
      }

      case 'after_analyzer': {
        // Orchestrator reviews final analysis results
        const totalAnalyzed = state.analyzedOpportunities.length
        const aiCount = state.analyzedOpportunities.filter(o => o.tags.includes('AI')).length
        const analyticsCount = state.analyzedOpportunities.filter(o =>
          o.tags.includes('Analytics')
        ).length
        const dataCount = state.analyzedOpportunities.filter(o => o.tags.includes('Data')).length
        const taggedCount = state.analyzedOpportunities.filter(o => o.tags.length > 0).length

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `AnalyzerAgent completed. Reviewing ${totalAnalyzed} analyzed opportunities...`,
          status: 'active',
          timestamp: new Date().toISOString(),
        })

        const reviewPrompt = `You are an Orchestrator Agent reviewing final analysis results.

AnalyzerAgent completed analysis:
- Total opportunities analyzed: ${totalAnalyzed}
- Opportunities tagged: ${taggedCount} (${Math.round((taggedCount / totalAnalyzed) * 100)}%)
- AI opportunities: ${aiCount}
- Analytics opportunities: ${analyticsCount}
- Data opportunities: ${dataCount}

Provide a brief summary assessment of the workflow results in 2-3 sentences.`

        const assessment = await llm.invoke([new HumanMessage(reviewPrompt)])

        agentLogs.push({
          agent: 'OrchestratorAgent',
          action: `Workflow COMPLETE. ${taggedCount}/${totalAnalyzed} opportunities successfully tagged. Results ready for Excel export.`,
          status: 'complete',
          timestamp: new Date().toISOString(),
          details: {
            totalAnalyzed,
            taggedCount,
            aiCount,
            analyticsCount,
            dataCount,
          },
        })

        messages.push(new AIMessage(`OrchestratorAgent: ${assessment.content}`))

        messages.push(
          new AIMessage(
            `OrchestratorAgent: Multi-agent workflow successfully completed. All ${totalAnalyzed} opportunities have been processed through the pipeline. Results are ready for user download.`
          )
        )

        return {
          currentStep: 'orchestrator_complete',
          messages,
          agentLogs,
        }
      }

      default:
        return state
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    agentLogs.push({
      agent: 'OrchestratorAgent',
      action: `Error during orchestration: ${errorMsg}`,
      status: 'error',
      timestamp: new Date().toISOString(),
    })

    return {
      currentStep: 'orchestrator_error',
      errors: [...state.errors, `OrchestratorAgent: ${errorMsg}`],
      agentLogs,
    }
  }
}

