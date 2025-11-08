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

interface CustomInstruction {
  id: string
  text: string
  category: 'AI' | 'Analytics' | 'Data'
  createdAt: string
}

function buildAnalysisPrompt(opportunity: Opportunity, customInstructions?: CustomInstruction[]): string {
  let prompt = `Analyze this business opportunity to determine if it involves AI, Analytics, or Data-related work.

Opportunity Name: ${opportunity.oppName}
Client: ${opportunity.clientName}

Categories:
- AI: Artificial Intelligence, Machine Learning, NLP, Computer Vision, Chatbots, Recommendation Engines, Generative AI
- Analytics: Business Intelligence, Dashboards, Reporting, Insights, Predictive Analytics, Visualization
- Data: Data Engineering, ETL, Databases, Data Lakes, Data Warehouses, Data Governance, Data Migration
`

  if (customInstructions && customInstructions.length > 0) {
    prompt += '\nCUSTOM IDENTIFICATION RULES:\n'
    
    const aiRules = customInstructions.filter(i => i.category === 'AI')
    const analyticsRules = customInstructions.filter(i => i.category === 'Analytics')
    const dataRules = customInstructions.filter(i => i.category === 'Data')
    
    if (aiRules.length > 0) {
      prompt += '\nAI Rules:\n'
      aiRules.forEach((rule, index) => {
        prompt += `${index + 1}. ${rule.text}\n`
      })
    }
    
    if (analyticsRules.length > 0) {
      prompt += '\nAnalytics Rules:\n'
      analyticsRules.forEach((rule, index) => {
        prompt += `${index + 1}. ${rule.text}\n`
      })
    }
    
    if (dataRules.length > 0) {
      prompt += '\nData Rules:\n'
      dataRules.forEach((rule, index) => {
        prompt += `${index + 1}. ${rule.text}\n`
      })
    }
  }

  prompt += `
Instructions:
1. Analyze the opportunity name for keywords and context
2. Apply the custom rules above (if provided) to make your decision
3. Assign appropriate tags (can be multiple: AI, Analytics, Data, or None)
4. Provide a clear rationale explaining your decision
5. Rate your confidence (0-100%)

Respond in JSON format:
{
  "tags": ["AI", "Analytics"],
  "rationale": "Clear explanation of why these tags were assigned",
  "confidence": 85
}`

  return prompt
}

export async function analyzeOpportunity(
  opportunity: Opportunity, 
  customInstructions?: CustomInstruction[]
): Promise<AnalyzedOpportunity> {
  const prompt = buildAnalysisPrompt(opportunity, customInstructions)

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
  onProgress?: (current: number, total: number) => void,
  customInstructions?: CustomInstruction[]
): Promise<AnalyzedOpportunity[]> {
  const results: AnalyzedOpportunity[] = []
  
  for (let i = 0; i < opportunities.length; i++) {
    const analyzed = await analyzeOpportunity(opportunities[i], customInstructions)
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

// Export the CustomInstruction type for use in other modules
export type { CustomInstruction }

