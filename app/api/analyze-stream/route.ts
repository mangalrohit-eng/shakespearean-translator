import { executeSimpleWorkflow } from '@/lib/agents/simple-workflow'
import { WorkflowState } from '@/lib/agents/state'
import type { CustomInstruction } from '@/lib/agents/analyzer'

export const maxDuration = 300 // 5 minutes for Vercel

export async function POST(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        
        if (!file) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No file uploaded' })}\n\n`)
          )
          controller.close()
          return
        }

        if (!process.env.OPENAI_API_KEY) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' })}\n\n`)
          )
          controller.close()
          return
        }

        // Parse custom instructions from form data (if provided)
        const customInstructionsJson = formData.get('customInstructions') as string | null
        let customInstructions: CustomInstruction[] | undefined
        if (customInstructionsJson) {
          try {
            customInstructions = JSON.parse(customInstructionsJson)
          } catch (e) {
            console.warn('Failed to parse custom instructions:', e)
          }
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()

        // Send initial orchestrator message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: 'Initializing multi-agent workflow: ExcelReader → Filter → Analyzer',
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Track sent results to avoid duplicates
        const sentResultIds = new Set<string>()

        // Execute the simple workflow with streaming
        const finalState = await executeSimpleWorkflow(
          arrayBuffer,
          customInstructions,
          (state: WorkflowState) => {
            // Stream agent logs
            state.agentLogs.forEach(log => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'agent',
                  agent: log.agent,
                  action: log.action,
                  status: log.status
                })}\n\n`)
              )
            })

            // Stream progress updates
            const latestProgress = state.progressUpdates[state.progressUpdates.length - 1]
            if (latestProgress) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  current: latestProgress.current,
                  total: latestProgress.total,
                  currentOpp: latestProgress.currentOpp,
                  status: 'Analyzing with AI (sequential processing)...'
                })}\n\n`)
              )
            }

            // Stream results as they become available
            state.analyzedOpportunities.forEach(result => {
              if (!sentResultIds.has(result.id)) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'result',
                    opportunity: result
                  })}\n\n`)
                )
                sentResultIds.add(result.id)
              }
            })
          }
        )

        // Check for errors
        if (finalState.errors.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: finalState.errors.join('; ')
            })}\n\n`)
          )
          controller.close()
          return
        }

        // Send final orchestrator message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: `Workflow complete. All ${finalState.analyzedOpportunities.length} opportunities processed through multi-agent pipeline. Ready for export.`,
            status: 'complete'
          })}\n\n`)
        )

        // Send any remaining results
        finalState.analyzedOpportunities.forEach(result => {
          if (!sentResultIds.has(result.id)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'result',
                opportunity: result
              })}\n\n`)
            )
          }
        })

        // Send completion message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            total: finalState.analyzedOpportunities.length
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Analysis failed'
          })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
