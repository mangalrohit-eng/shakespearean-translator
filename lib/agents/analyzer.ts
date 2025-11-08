import OpenAI from 'openai'
import { Opportunity, AnalyzedOpportunity } from '../types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisResult {
  tags: string[]
  rationale: string
  confidence: number
}

export async function analyzeOpportunity(opportunity: Opportunity): Promise<AnalyzedOpportunity> {
  const prompt = `Analyze this business opportunity to determine if it involves AI, Analytics, or Data-related work.

Opportunity Name: ${opportunity.oppName}
Client: ${opportunity.clientName}

Categories:
- AI: Artificial Intelligence, Machine Learning, NLP, Computer Vision, Chatbots, Recommendation Engines, Generative AI
- Analytics: Business Intelligence, Dashboards, Reporting, Insights, Predictive Analytics, Visualization
- Data: Data Engineering, ETL, Databases, Data Lakes, Data Warehouses, Data Governance, Data Migration

Instructions:
1. Analyze the opportunity name for keywords and context
2. Assign appropriate tags (can be multiple: AI, Analytics, Data, or None)
3. Provide a clear rationale explaining your decision
4. Rate your confidence (0-100%)

Respond in JSON format:
{
  "tags": ["AI", "Analytics"],
  "rationale": "Clear explanation of why these tags were assigned",
  "confidence": 85
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst specializing in identifying AI, Analytics, and Data opportunities. Be precise and conservative - only tag if clearly relevant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 300,
    })

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}') as AnalysisResult

    return {
      ...opportunity,
      tags: result.tags || [],
      rationale: result.rationale || 'No analysis available',
      confidence: result.confidence || 0,
    }
  } catch (error) {
    console.error('Analysis error:', error)
    return {
      ...opportunity,
      tags: [],
      rationale: 'Error during analysis',
      confidence: 0,
    }
  }
}

export async function analyzeOpportunitiesBatch(
  opportunities: Opportunity[],
  onProgress?: (current: number, total: number) => void
): Promise<AnalyzedOpportunity[]> {
  const results: AnalyzedOpportunity[] = []
  
  for (let i = 0; i < opportunities.length; i++) {
    const analyzed = await analyzeOpportunity(opportunities[i])
    results.push(analyzed)
    
    if (onProgress) {
      onProgress(i + 1, opportunities.length)
    }
    
    // Small delay to avoid rate limits
    if (i < opportunities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

