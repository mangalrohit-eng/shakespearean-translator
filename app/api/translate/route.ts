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

    // Create a simple rule-based Shakespearean translator (no API needed!)
    const shakespeareanTranslate = (input: string): string => {
      const replacements: { [key: string]: string } = {
        'you are': 'thou art',
        "you're": 'thou art',
        'you': 'thee',
        'your': 'thy',
        'yours': 'thine',
        'yes': 'aye',
        'no': 'nay',
        'hello': 'hail',
        'how are you': 'how dost thou fare',
        'what': 'what',
        'where': 'whither',
        'when': 'when',
        'why': 'wherefore',
        'do': 'doth',
        'does': 'doth',
        'have': 'hath',
        'has': 'hath',
        'think': 'methinks',
        'before': 'ere',
        'nothing': 'naught',
      };
      
      let result = input.toLowerCase();
      for (const [modern, archaic] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${modern}\\b`, 'gi');
        result = result.replace(regex, archaic);
      }
      
      // Capitalize first letter
      return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Use simple rule-based translation (100% reliable and free)
    const translated = shakespeareanTranslate(text);
    
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

