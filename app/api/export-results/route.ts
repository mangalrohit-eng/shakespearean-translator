import { NextResponse } from 'next/server'
import { createExcelOutput } from '@/lib/excel/writer'
import type { AnalyzedOpportunity } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { results } = await request.json()
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'No results provided' },
        { status: 400 }
      )
    }

    // Generate Excel file from analyzed results
    const excelBuffer = createExcelOutput(results as AnalyzedOpportunity[])

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(excelBuffer)

    // Return Excel file as blob
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="tagged-opportunities.xlsx"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

