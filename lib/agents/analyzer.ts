import OpenAI from 'openai'
import { Opportunity, AnalyzedOpportunity, CustomInstruction } from '../types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisResult {
  tags: string[]
  rationale: string
  confidence: number
}

function buildAnalysisPrompt(opportunity: Opportunity, customInstructions?: CustomInstruction[]): string {
  const hasDescription = opportunity.dealDescription && opportunity.dealDescription.trim().length > 0
  
  let prompt = `Analyze this business opportunity to determine if it involves AI, Analytics, Data, or Generative AI-related work.

Opportunity Name: ${opportunity.opportunityName}
${hasDescription ? `Deal Description: ${opportunity.dealDescription}` : '(No description available - analyze based on name only)'}
Account: ${opportunity.accountName}
${opportunity.industryName ? `Industry: ${opportunity.industryName}` : ''}

Categories:
- AI: Traditional Artificial Intelligence, Machine Learning, NLP, Computer Vision, Recommendation Engines, Predictive Models (NOT Generative AI)
- Gen AI: Generative AI projects where we deliver Gen AI solutions to clients (LLMs, GPT, Claude, Copilot implementations, RAG systems, AI Agents, Agentic AI, Custom Gen AI applications, AI Chatbots using LLMs)
- Analytics: Business Intelligence, Dashboards, Reporting, Insights, Predictive Analytics, Visualization
- Data: Data Engineering, ETL, Databases, Data Lakes, Data Warehouses, Data Governance, Data Migration

IMPORTANT: Use "Gen AI" tag ONLY for deals where we're building/delivering Generative AI solutions to the client (not just using AI internally for analysis).
`

  if (customInstructions && customInstructions.length > 0) {
    prompt += '\nCUSTOM IDENTIFICATION RULES:\n'
    
    const aiRules = customInstructions.filter(i => i.category === 'AI')
    const genAiRules = customInstructions.filter(i => i.category === 'Gen AI')
    const analyticsRules = customInstructions.filter(i => i.category === 'Analytics')
    const dataRules = customInstructions.filter(i => i.category === 'Data')
    
    if (aiRules.length > 0) {
      prompt += '\nAI Rules:\n'
      aiRules.forEach((rule, index) => {
        prompt += `${index + 1}. ${rule.text}\n`
      })
    }
    
    if (genAiRules.length > 0) {
      prompt += '\nGen AI Rules:\n'
      genAiRules.forEach((rule, index) => {
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
1. ${hasDescription 
    ? 'Analyze BOTH the opportunity name AND deal description for keywords and context' 
    : 'Analyze the opportunity name carefully for keywords and context (no description available)'}
2. ${hasDescription 
    ? 'The description provides crucial details - give it significant weight in your analysis' 
    : 'Without a description, make your best judgment based on the opportunity name alone'}
3. Apply the custom rules above (if provided) to make your decision
4. Assign appropriate tags: "AI", "Gen AI", "Analytics", and/or "Data" (can be multiple or EMPTY if not relevant)
5. IMPORTANT: If the opportunity is NOT related to AI, Gen AI, Analytics, or Data, return an EMPTY array for tags - do NOT use "None" or any other placeholder
6. Distinguish between traditional "AI" and "Gen AI" - use "Gen AI" ONLY when the deliverable involves Generative AI solutions
7. Provide a clear rationale explaining your decision
8. Rate your confidence (0-100%) using this calibrated scale:
   - 90-100%: VERY HIGH confidence - explicit, clear mentions of specific technologies/keywords with detailed context
   - 70-89%: HIGH confidence - strong indicators and relevant keywords, clear connection to the category
   - 50-69%: MEDIUM confidence - some relevant keywords but ambiguous context, could go either way
   - 30-49%: LOW confidence - vague or indirect indicators, making educated guess based on limited information
   - 0-29%: VERY LOW confidence - highly uncertain, minimal or no clear indicators
   ${!hasDescription ? 'NOTE: Without description, confidence should typically be LOWER (under 70%) unless the opportunity name is crystal clear' : ''}

BE HONEST about uncertainty. It's better to score 30-50% when you're unsure than to artificially inflate confidence.

Respond in JSON format:
{
  "tags": ["Gen AI", "AI"],
  "rationale": "Clear explanation of why these tags were assigned",
  "confidence": 85
}

Or if NOT relevant:
{
  "tags": [],
  "rationale": "This opportunity does not involve AI, Gen AI, Analytics, or Data work",
  "confidence": 90
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
          content: 'You are an expert business analyst specializing in identifying AI, Gen AI, Analytics, and Data opportunities. Be precise and conservative - only tag if clearly relevant. Distinguish between traditional AI and Generative AI solutions. IMPORTANT: Use the FULL confidence range (0-100%). Be honest about uncertainty - assign LOW confidence (30-50%) when evidence is weak or ambiguous, and HIGH confidence (85-100%) only when you have clear, explicit evidence.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 400,
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

