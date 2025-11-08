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

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

    const prompt = `Task: Translate the following modern English text into Shakespearean English. Use thee, thou, thy, thine, hath, doth, and other archaic terms. Use poetic and eloquent language as Shakespeare would write. Only provide the translated text.

Modern English: ${text}

Shakespearean English:`

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      }
    })

    let translated = response.generated_text.trim()
    
    // Clean up the response - remove any extra explanations
    const lines = translated.split('\n')
    translated = lines[0].trim()

    return NextResponse.json({ translated })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate text. Please try again.' },
      { status: 500 }
    )
  }
}

