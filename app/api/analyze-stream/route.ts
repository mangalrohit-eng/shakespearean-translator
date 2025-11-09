import { parseExcelFile, filterCommsMedia } from '@/lib/excel/reader'
import { ParallelAnalyzer } from '@/lib/performance/parallel-analyzer'
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

        // Orchestrator initializes
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: 'Coordinating multi-agent workflow',
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Orchestrator → Excel Reader
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: 'Instructing Excel Reader to parse uploaded file',
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 200))

        // Tool: Excel Reader Agent
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Excel Reader (Tool)',
            action: 'Parsing Excel file structure...',
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        // Read Excel file
        const arrayBuffer = await file.arrayBuffer()
        const rawData = parseExcelFile(arrayBuffer)

        if (rawData.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No data found in Excel file' })}\n\n`)
          )
          controller.close()
          return
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Excel Reader (Tool)',
            action: `Successfully extracted ${rawData.length} rows`,
            status: 'complete'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 200))

        // Orchestrator → Filter
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: `Requesting Filter Tool to extract Comms & Media opportunities from ${rawData.length} rows`,
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Tool: Filter Agent
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Filter (Tool)',
            action: 'Applying client group filter: US-Comms & Media...',
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        // Filter for Comms & Media
        const filteredOpportunities = filterCommsMedia(rawData)

        if (filteredOpportunities.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No Comms & Media opportunities found' })}\n\n`)
          )
          controller.close()
          return
        }

        // Show sample opportunities found
        const sampleOpps = filteredOpportunities.slice(0, 3).map(o => o.oppName).join(', ')
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Filter (Tool)',
            action: `Filter complete: ${filteredOpportunities.length} Comms & Media opportunities identified. Sample: "${sampleOpps}${filteredOpportunities.length > 3 ? '...' : ''}"`,
            status: 'complete'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 200))

        // Filter → Orchestrator (response)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Filter (Tool)',
            action: `Passing ${filteredOpportunities.length} opportunities back to Orchestrator for analysis`,
            status: 'complete'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Orchestrator → Analyzer Agents
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: `Received ${filteredOpportunities.length} filtered opportunities. Dispatching to AI Analyzer Agent pool with parallel processing (batch size: 3)`,
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Load custom instructions from request (if provided)
        const customInstructions: CustomInstruction[] | undefined = undefined
        // Note: Custom instructions would be passed from client in real scenario

        // Analyzer Agents (with parallel processing)
        const total = filteredOpportunities.length
        const analyzer = new ParallelAnalyzer()

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Analyzer Agent',
            action: 'Initialized AI analysis engine with parallel processing',
            status: 'active'
          })}\n\n`)
        )

        // Progress callback
        const onProgress = (current: number, total: number, currentOpp: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              current,
              total,
              currentOpp,
              status: 'Analyzing with AI (parallel processing)...'
            })}\n\n`)
          )
        }

        // Agent update callback
        const onAgentUpdate = (agent: string, action: string, status: 'active' | 'complete') => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent',
              agent,
              action,
              status
            })}\n\n`)
          )
        }

        // Run parallel analysis with performance optimizations
        const results = await analyzer.analyzeOpportunities(
          filteredOpportunities,
          customInstructions,
          onProgress,
          onAgentUpdate
        )

        await new Promise(resolve => setTimeout(resolve, 200))

        // Orchestrator receives results
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: `Received analyzed results from Analyzer Agent. Preparing Excel export...`,
            status: 'active'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Send all results
        results.forEach(analyzed => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              opportunity: analyzed
            })}\n\n`)
          )
        })

        // Orchestrator complete
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Orchestrator',
            action: `Workflow complete. ${results.length} opportunities analyzed and ready for export.`,
            status: 'complete'
          })}\n\n`)
        )

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            total: results.length
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

