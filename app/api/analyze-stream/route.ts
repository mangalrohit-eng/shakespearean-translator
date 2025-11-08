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

        // Agent 1: Excel Reader Agent
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Excel Reader Agent',
            action: 'Reading Excel file...',
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
            agent: 'Excel Reader Agent',
            action: `Found ${rawData.length} opportunities`,
            status: 'complete'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Agent 2: Filter Agent
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Filter Agent',
            action: 'Filtering for US-Comms & Media opportunities...',
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

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'agent',
            agent: 'Filter Agent',
            action: `Filtered to ${filteredOpportunities.length} Comms & Media opportunities`,
            status: 'complete'
          })}\n\n`)
        )

        await new Promise(resolve => setTimeout(resolve, 300))

        // Load custom instructions from request (if provided)
        const customInstructions: CustomInstruction[] | undefined = undefined
        // Note: Custom instructions would be passed from client in real scenario

        // Agent 3-5: Analyzer Agent (with parallel processing)
        const total = filteredOpportunities.length
        const analyzer = new ParallelAnalyzer()

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

        // Send all results
        results.forEach(analyzed => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              opportunity: analyzed
            })}\n\n`)
          )
        })

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

