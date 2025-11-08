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

    const prompt = `Translate the following modern English text into Shakespearean English. Use archaic terms like thee, thou, thy, thine, hath, doth. Make it eloquent and poetic:

"${text}"

Shakespearean translation:`

    // Using Hugging Face Inference API directly with fetch
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.9,
            do_sample: true,
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

    // Clean up the response - remove any extra text after line breaks
    const lines = translated.split('\n')
    translated = lines[0].trim()

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

