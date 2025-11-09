import { NextResponse } from 'next/server'
import { executeSimpleWorkflow } from '@/lib/agents/simple-workflow'

export const maxDuration = 300 // 5 minutes for Vercel

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const customInstructionsString = formData.get('customInstructions') as string
    const customInstructions = customInstructionsString ? JSON.parse(customInstructionsString) : []
    
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()

    // Execute the real LangGraph agent workflow
    const finalState = await executeSimpleWorkflow(
      arrayBuffer,
      customInstructions
    )

    // Check for errors from the workflow
    if (finalState.errors.length > 0) {
      return NextResponse.json(
        { error: finalState.errors[0] },
        { status: 400 }
      )
    }

    if (finalState.analyzedOpportunities.length === 0) {
      return NextResponse.json(
        { error: 'No opportunities were analyzed. Check if the file contains Comms & Media opportunities.' },
        { status: 400 }
      )
    }

    // Return JSON results instead of Excel file
    return NextResponse.json({
      results: finalState.analyzedOpportunities,
      total: finalState.analyzedOpportunities.length
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze opportunities. Please try again.' },
      { status: 500 }
    )
  }
}

