import { NextResponse } from 'next/server'

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

    // Create prompt for text generation
    const prompt = `Translate the following modern English text into Shakespearean English. Use archaic words like thee, thou, thy, thine, hath, doth, art, and make it sound eloquent and poetic like Shakespeare wrote it.

Modern English: ${text}

Shakespearean English:`

    // Using Hugging Face Inference API with GPT-2
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.9,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
            use_cache: false,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Hugging Face API error:', response.status, errorData)
      return NextResponse.json(
        { error: `API Error: ${response.status}. ${errorData}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('Hugging Face response:', data)

    let translated = ''
    
    if (Array.isArray(data) && data[0]?.generated_text) {
      translated = data[0].generated_text.trim()
    } else if (data.generated_text) {
      translated = data.generated_text.trim()
    } else {
      console.error('Unexpected response format:', data)
      return NextResponse.json(
        { error: 'Unexpected response from AI model' },
        { status: 500 }
      )
    }

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

