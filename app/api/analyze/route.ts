import { NextResponse } from 'next/server'
import { parseExcelFile, filterCommsMedia } from '@/lib/excel/reader'
import { createExcelOutput } from '@/lib/excel/writer'
import { analyzeOpportunitiesBatch } from '@/lib/agents/analyzer'

export const maxDuration = 300 // 5 minutes for Vercel

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const rawData = parseExcelFile(arrayBuffer)

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      )
    }

    // Filter for Comms & Media
    const filteredOpportunities = filterCommsMedia(rawData)

    if (filteredOpportunities.length === 0) {
      return NextResponse.json(
        { error: 'No Comms & Media opportunities found in the file' },
        { status: 400 }
      )
    }

    // Analyze opportunities
    const analyzedOpportunities = await analyzeOpportunitiesBatch(filteredOpportunities)

    // Create output Excel
    const outputBuffer = createExcelOutput(analyzedOpportunities)

    // Return the Excel file
    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tagged-opportunities.xlsx"',
      },
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze opportunities. Please try again.' },
      { status: 500 }
    )
  }
}

