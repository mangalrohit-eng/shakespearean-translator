import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Use OpenAI to translate to Shakespearean English
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a translator that converts modern English into Shakespearean English. Use archaic terms like thee, thou, thy, thine, hath, doth, art, and methinks. Transform the text to sound eloquent and poetic as if Shakespeare wrote it. Only return the translated text, nothing else.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const translated = completion.choices[0]?.message?.content || 'Translation failed'

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

