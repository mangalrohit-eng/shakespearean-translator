import { NextResponse } from 'next/server'
import { createExcelOutput } from '@/lib/excel/writer'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const resultsString = formData.get('results') as string
    
    if (!resultsString) {
      return NextResponse.json(
        { error: 'No results provided' },
        { status: 400 }
      )
    }

    const results = JSON.parse(resultsString)

    // Create output Excel from analyzed opportunities
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
      { error: 'Failed to generate Excel file. Please try again.' },
      { status: 500 }
    )
  }
}

