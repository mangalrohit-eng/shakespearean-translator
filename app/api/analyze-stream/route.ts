import { parseExcelFile, filterCommsMedia } from '@/lib/excel/reader'
import { analyzeOpportunity } from '@/lib/agents/analyzer'

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

        const total = filteredOpportunities.length
        const results = []

        // Process each opportunity with progress updates
        for (let i = 0; i < filteredOpportunities.length; i++) {
          const opportunity = filteredOpportunities[i]

          // Agent 3: Analyzer Agent
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent',
              agent: 'Analyzer Agent',
              action: `Analyzing: "${opportunity.oppName}"`,
              status: 'active'
            })}\n\n`)
          )

          // Send progress update
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              current: i + 1,
              total,
              currentOpp: opportunity.oppName,
              status: 'Analyzing keywords and context...'
            })}\n\n`)
          )

          // Agent 4: Tagger Agent
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent',
              agent: 'Tagger Agent',
              action: 'Assigning tags...',
              status: 'active'
            })}\n\n`)
          )

          // Analyze opportunity
          const analyzed = await analyzeOpportunity(opportunity)
          results.push(analyzed)

          // Agent 5: Rationale Agent
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent',
              agent: 'Rationale Agent',
              action: 'Generating explanation...',
              status: 'active'
            })}\n\n`)
          )

          await new Promise(resolve => setTimeout(resolve, 200))

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'agent',
              agent: 'Rationale Agent',
              action: `Complete: ${analyzed.tags.join(', ') || 'None'}`,
              status: 'complete'
            })}\n\n`)
          )

          // Send result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              opportunity: analyzed
            })}\n\n`)
          )

          // Small delay to avoid rate limits
          if (i < filteredOpportunities.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

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

