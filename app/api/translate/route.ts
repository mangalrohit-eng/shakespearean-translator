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

    const prompt = `<s>[INST] You are a translator that converts modern English into Shakespearean English. Use thee, thou, thy, thine, hath, doth, and other archaic Elizabethan terms. Transform the style completely into eloquent Shakespearean language while keeping the same meaning.

Translate this to Shakespearean English: ${text} [/INST]`

    // Using Hugging Face Inference API directly with fetch
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
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

