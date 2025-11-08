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

    // Format for instruction-following model
    const systemPrompt = `<|system|>
You are a Shakespearean translator. Convert modern English to Shakespearean English using archaic terms like thee, thou, thy, thine, hath, doth, art, and methinks.</|system|>
<|user|>
Translate to Shakespearean English: ${text}</|user|>
<|assistant|>`

    // Using NEW Hugging Face Inference API endpoint
    const response = await fetch(
      'https://api-inference.huggingface.co/hf-inference/gpt2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: systemPrompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.8,
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
    } else if (Array.isArray(data) && data[0]) {
      translated = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0])
    } else {
      console.error('Unexpected response format:', data)
      return NextResponse.json(
        { error: 'Unexpected response from AI model' },
        { status: 500 }
      )
    }

    // Clean up the response - take first sentence or line
    const lines = translated.split('\n')
    translated = lines[0].trim()
    
    // If it's too long, cut at first sentence
    if (translated.length > 200) {
      const sentences = translated.split(/[.!?]/)
      translated = sentences[0] + '.'
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

