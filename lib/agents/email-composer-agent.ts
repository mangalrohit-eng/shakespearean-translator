import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'

const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7, // Higher temperature for more creative, personalized writing
})

interface EmailCompositionResult {
  captain: string
  tag: string
  subject: string
  body: string
  opportunities: any[]
}

/**
 * Email Composer Agent
 * Uses LLM to generate professional, personalized emails for D&AI captains
 */
export async function emailComposerAgent(
  state: WorkflowState,
  onUpdate?: (log: any) => void
): Promise<Partial<WorkflowState>> {
  const startTime = Date.now()
  
  // Log agent start
  onUpdate?.({
    agent: 'EmailComposerAgent',
    agentType: 'Agent',
    action: 'Analyzing tagged opportunities to compose personalized emails for D&AI captains',
    status: 'active',
    details: {
      totalOpportunities: state.analyzedOpportunities?.length || 0,
      timestamp: new Date().toISOString()
    }
  })

  try {
    const opportunities = state.analyzedOpportunities || []
    
    // Group opportunities by tags
    const aiOpps = opportunities.filter((opp: any) => opp.tags.includes('AI'))
    const analyticsOpps = opportunities.filter((opp: any) => opp.tags.includes('Analytics'))
    const dataOpps = opportunities.filter((opp: any) => opp.tags.includes('Data'))

    onUpdate?.({
      agent: 'EmailComposerAgent',
      agentType: 'Agent',
      action: `LLM Reasoning: Identified ${aiOpps.length} AI, ${analyticsOpps.length} Analytics, and ${dataOpps.length} Data opportunities`,
      status: 'active',
      details: {
        categorization: {
          ai: aiOpps.length,
          analytics: analyticsOpps.length,
          data: dataOpps.length
        }
      }
    })

    const emails: EmailCompositionResult[] = []

    // Generate email for AI Captain if there are AI opportunities
    if (aiOpps.length > 0) {
      const aiEmail = await generateCaptainEmail('AI', aiOpps, onUpdate)
      emails.push(aiEmail)
    }

    // Generate email for Analytics Captain if there are Analytics opportunities
    if (analyticsOpps.length > 0) {
      const analyticsEmail = await generateCaptainEmail('Analytics', analyticsOpps, onUpdate)
      emails.push(analyticsEmail)
    }

    // Generate email for Data Captain if there are Data opportunities
    if (dataOpps.length > 0) {
      const dataEmail = await generateCaptainEmail('Data', dataOpps, onUpdate)
      emails.push(dataEmail)
    }

    const duration = Date.now() - startTime

    onUpdate?.({
      agent: 'EmailComposerAgent',
      agentType: 'Agent',
      action: `✓ Successfully composed ${emails.length} personalized emails for D&AI captains`,
      status: 'complete',
      details: {
        emailsGenerated: emails.length,
        recipients: emails.map(e => e.captain),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    })

    // Add to messages
    const newMessages = [
      new HumanMessage('Compose personalized emails for D&AI captains with tagged opportunities'),
      new AIMessage(`Composed ${emails.length} professional emails with opportunity details and actionable recommendations`)
    ]

    return {
      messages: [...(state.messages || []), ...newMessages],
      captainEmails: emails,
      logs: [
        ...(state.logs || []),
        {
          agent: 'EmailComposerAgent',
          action: `Composed ${emails.length} emails`,
          timestamp: new Date().toISOString()
        }
      ]
    }
  } catch (error: any) {
    onUpdate?.({
      agent: 'EmailComposerAgent',
      agentType: 'Agent',
      action: `Error composing emails: ${error.message}`,
      status: 'active',
      details: { error: error.message }
    })

    return {
      logs: [
        ...(state.logs || []),
        {
          agent: 'EmailComposerAgent',
          action: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        }
      ]
    }
  }
}

/**
 * Generate a personalized email for a specific D&AI captain using LLM
 */
async function generateCaptainEmail(
  tag: string,
  opportunities: any[],
  onUpdate?: (log: any) => void
): Promise<EmailCompositionResult> {
  onUpdate?.({
    agent: 'EmailComposerAgent',
    agentType: 'Agent',
    action: `Generating personalized email for ${tag} Captain using LLM`,
    status: 'active',
    details: {
      tag,
      opportunityCount: opportunities.length,
      topOpportunities: opportunities.slice(0, 3).map(o => o.dealName)
    }
  })

  // Prepare opportunity summary for LLM
  const oppSummary = opportunities.map(opp => 
    `- ${opp.dealName} (ID: ${opp.id}, Confidence: ${opp.confidence}%, Tags: ${opp.tags.join(', ')})\n  Rationale: ${opp.rationale}`
  ).join('\n\n')

  // Calculate statistics
  const highConfidenceCount = opportunities.filter(o => o.confidence >= 80).length
  const avgConfidence = Math.round(opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length)

  const prompt = `You are an AI email composition agent for Accenture's Data & AI Opportunity Intelligence System. 

Your task is to compose a professional, actionable email to the ${tag} Captain about ${opportunities.length} relevant opportunities in the Communications & Media sector.

OPPORTUNITY SUMMARY:
${oppSummary}

STATISTICS:
- Total opportunities: ${opportunities.length}
- High-confidence opportunities (≥80%): ${highConfidenceCount}
- Average confidence: ${avgConfidence}%

INSTRUCTIONS:
1. Write a professional email that:
   - Opens with a personalized greeting to the ${tag} Captain
   - Provides a clear executive summary with key metrics
   - Highlights the most promising opportunities (high confidence scores)
   - Includes specific, actionable next steps tailored to ${tag} capabilities
   - Maintains Accenture's professional tone and brand voice
   - Is concise but comprehensive (aim for 400-600 words)

2. Structure the email as HTML with:
   - Professional paragraphs with proper spacing
   - An "Executive Summary" section with key metrics in a list
   - An "Opportunity Highlights" section featuring top 3-5 opportunities
   - A "Full Opportunity List" in a table format
   - A "Recommended Next Steps" section with numbered actions
   - Professional sign-off

3. Use appropriate HTML tags: <p>, <h3>, <ul>, <ol>, <table>, <strong>, etc.

4. Make the content specific to ${tag} - reference relevant ${tag} technologies, methodologies, and value propositions.

Generate the email HTML body now:`

  try {
    const response = await model.invoke([new HumanMessage(prompt)])
    const emailBody = response.content.toString()

    onUpdate?.({
      agent: 'EmailComposerAgent',
      agentType: 'Agent',
      action: `✓ LLM generated ${tag} Captain email (${emailBody.length} characters)`,
      status: 'active',
      details: {
        tag,
        wordCount: emailBody.split(/\s+/).length,
        opportunitiesIncluded: opportunities.length
      }
    })

    return {
      captain: `${tag} Captain`,
      tag,
      subject: `D&AI Opportunity Review - ${tag} Focus Areas (${opportunities.length} Opportunities)`,
      body: emailBody,
      opportunities
    }
  } catch (error: any) {
    console.error(`Error generating ${tag} email:`, error)
    
    // Fallback to template if LLM fails
    return generateFallbackEmail(tag, opportunities)
  }
}

/**
 * Fallback email template if LLM generation fails
 */
function generateFallbackEmail(tag: string, opportunities: any[]): EmailCompositionResult {
  const highConfidenceOpps = opportunities.filter(o => o.confidence >= 80)
  
  const body = `
<div class="email-content">
  <p>Dear ${tag} Captain,</p>
  
  <p>I hope this email finds you well. Our AI-powered analysis system has identified <strong>${opportunities.length} opportunities</strong> within the Communications & Media sector that align with <strong>${tag}</strong> capabilities.</p>
  
  <h3>Executive Summary</h3>
  <ul>
    <li><strong>Total Opportunities:</strong> ${opportunities.length}</li>
    <li><strong>High-Confidence Opportunities (≥80%):</strong> ${highConfidenceOpps.length}</li>
    <li><strong>Focus Area:</strong> ${tag}</li>
    <li><strong>Sector:</strong> Communications & Media</li>
    <li><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</li>
  </ul>
  
  <h3>Opportunity Details</h3>
  <table class="email-table">
    <thead>
      <tr>
        <th>Opportunity ID</th>
        <th>Opportunity Name</th>
        <th>Tags</th>
        <th>Confidence</th>
        <th>Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${opportunities.map(opp => `
        <tr>
          <td>${opp.id}</td>
          <td><strong>${opp.dealName}</strong></td>
          <td>${opp.tags.join(', ')}</td>
          <td>${opp.confidence}%</td>
          <td>${opp.rationale}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h3>Recommended Next Steps</h3>
  <ol>
    <li><strong>Priority Review:</strong> Focus on opportunities with confidence scores above 80%</li>
    <li><strong>Client Engagement:</strong> Coordinate with account teams for discovery sessions</li>
    <li><strong>Solution Mapping:</strong> Identify relevant ${tag} solutions from our portfolio</li>
    <li><strong>Proposal Development:</strong> Prepare tailored value propositions</li>
  </ol>
  
  <p>Please let me know if you need any additional information.</p>
  
  <p>Best regards,<br>
  <strong>Data & AI Opportunity Intelligence System</strong><br>
  Accenture | Communications & Media</p>
</div>
  `.trim()

  return {
    captain: `${tag} Captain`,
    tag,
    subject: `D&AI Opportunity Review - ${tag} Focus Areas (${opportunities.length} Opportunities)`,
    body,
    opportunities
  }
}

