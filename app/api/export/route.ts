import { NextResponse } from 'next/server'
import { createExcelOutput } from '@/lib/excel/writer'
import { AnalyzedOpportunity } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { results } = await request.json() as { results: AnalyzedOpportunity[] }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'No results to export' },
        { status: 400 }
      )
    }

    // Create output Excel
    const outputBuffer = createExcelOutput(results)

    // Return the Excel file
    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tagged-opportunities.xlsx"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export results' },
      { status: 500 }
    )
  }
}

