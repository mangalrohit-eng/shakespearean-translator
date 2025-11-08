import { NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json(
        { error: 'Hugging Face API key is not configured. Please add HUGGINGFACE_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Initialize Hugging Face Inference Client
    const client = new HfInference(process.env.HUGGINGFACE_API_KEY)

    // Create prompt for text generation
    const prompt = `Translate the following modern English text into Shakespearean English. Use archaic words like thee, thou, thy, thine, hath, doth, art, and make it sound eloquent and poetic like Shakespeare wrote it.

Modern English: ${text}

Shakespearean English:`

    // Use Hugging Face text generation with provider specified
    const result = await client.textGeneration({
      model: 'gpt2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.9,
        top_p: 0.95,
        do_sample: true,
        return_full_text: false,
      },
      provider: 'hf-inference',
    })

    console.log('Hugging Face response:', result)

    let translated = result.generated_text.trim()
    
    // Clean up the response - take first meaningful line
    const lines = translated.split('\n').filter(line => line.trim().length > 0)
    translated = lines[0]?.trim() || translated
    
    // If it's too long, cut at first sentence
    if (translated.length > 250) {
      const sentenceEnd = translated.search(/[.!?]/)
      if (sentenceEnd > 0) {
        translated = translated.substring(0, sentenceEnd + 1)
      }
    }

    return NextResponse.json({ translated })
  } catch (error) {
    console.error('Translation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to translate: ${errorMessage}` },
      { status: 500 }
    )
  }
}

