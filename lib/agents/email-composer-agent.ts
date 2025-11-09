import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { WorkflowState } from './state'

const chat = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.7, // Higher temperature for more creative email writing
})

export async function emailComposerAgent(
  state: WorkflowState,
  onUpdate?: (log: any) => void
): Promise<Partial<WorkflowState>> {
  onUpdate?.({
    agent: 'EmailComposerAgent',
    action: 'Starting email composition for D&AI captains',
    status: 'active',
    details: {
      totalOpportunities: state.analyzedOpportunities.length
    }
  })

  // Group opportunities by D&AI Captain
  const opportunitiesByCaptain = state.analyzedOpportunities.reduce((acc, opp) => {
    const captain = opp.daiCaptain || 'Unassigned'
    if (!acc[captain]) {
      acc[captain] = []
    }
    acc[captain].push(opp)
    return acc
  }, {} as Record<string, typeof state.analyzedOpportunities>)

  const captainNames = Object.keys(opportunitiesByCaptain)

  onUpdate?.({
    agent: 'EmailComposerAgent',
    action: `Identified ${captainNames.length} D&AI captain(s): ${captainNames.join(', ')}`,
    status: 'active',
    details: {
      captains: captainNames,
      opportunitiesPerCaptain: Object.entries(opportunitiesByCaptain).map(([captain, opps]) => ({
        captain,
        count: opps.length
      }))
    }
  })

  // Generate email content using LLM for each captain
  const generateEmailContent = async (captain: string, opportunities: any[]) => {
    // Group by tags for better organization within each captain's email
    const aiOpps = opportunities.filter(o => o.tags.includes('AI'))
    const analyticsOpps = opportunities.filter(o => o.tags.includes('Analytics'))
    const dataOpps = opportunities.filter(o => o.tags.includes('Data'))

    // Calculate statistics
    const totalValue = opportunities.reduce((sum, o) => sum + (o.total || 0), 0)
    const avgConfidence = opportunities.reduce((sum, o) => sum + (o.confidence || 0), 0) / opportunities.length

    const prompt = `You are an AI agent writing a professional executive email for a D&AI Captain named "${captain}".

Context:
- Captain: ${captain}
- Total Opportunities: ${opportunities.length}
- AI-focused: ${aiOpps.length}
- Analytics-focused: ${analyticsOpps.length}
- Data-focused: ${dataOpps.length}
- Total Deal Value: $${totalValue.toLocaleString()}
- Average Confidence Score: ${Math.round(avgConfidence * 100)}%

Opportunities Details:
${opportunities.slice(0, 10).map(o => `• ${o.oppName} (${o.tags.join(', ')}) - Confidence: ${Math.round(o.confidence * 100)}% - Rationale: ${o.rationale}`).join('\n')}
${opportunities.length > 10 ? `\n... and ${opportunities.length - 10} more opportunities` : ''}

Write a professional email with the following structure:
1. **Executive Summary**: Brief overview with key metrics
2. **Opportunity Breakdown**: Organize by AI/Analytics/Data categories
3. **Top Priorities**: Highlight the 3-5 highest-confidence opportunities
4. **Next Steps**: Clear action items for the captain

Requirements:
- Professional tone, concise and executive-ready
- Use HTML formatting for better readability (<h3>, <p>, <ul>, <strong>, <table>)
- Include a summary table of top opportunities
- Make it actionable and data-driven
- Keep it under 800 words

Write the email body (HTML format) without subject line:`

    try {
      onUpdate?.({
        agent: 'EmailComposerAgent',
        action: `Generating email content for ${captain} (${opportunities.length} opportunities)`,
        status: 'active'
      })

      const llmResponse = await chat.invoke([new HumanMessage(prompt)])
      const emailBody = llmResponse.content.toString()

      onUpdate?.({
        agent: 'EmailComposerAgent',
        action: `✓ Email generated for ${captain} (${emailBody.length} chars)`,
        status: 'active',
        details: {
          captain,
          opportunities: opportunities.length,
          wordCount: emailBody.split(' ').length,
          charCount: emailBody.length
        }
      })

      return emailBody
    } catch (llmError) {
      console.error('LLM email generation failed, using template:', llmError)
      
      // Fallback to template if LLM fails
      return `
        <h3>Executive Summary</h3>
        <p>Dear ${captain},</p>
        <p>This report summarizes ${opportunities.length} D&AI opportunities assigned to you, identified from our US Communications & Media portfolio.</p>
        
        <h3>Key Metrics</h3>
        <ul>
          <li><strong>Total Opportunities:</strong> ${opportunities.length}</li>
          <li><strong>AI-focused:</strong> ${aiOpps.length}</li>
          <li><strong>Analytics-focused:</strong> ${analyticsOpps.length}</li>
          <li><strong>Data-focused:</strong> ${dataOpps.length}</li>
          <li><strong>Total Deal Value:</strong> $${totalValue.toLocaleString()}</li>
          <li><strong>Average Confidence:</strong> ${Math.round(avgConfidence * 100)}%</li>
        </ul>

        <h3>Top Opportunities</h3>
        <table class="email-table" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: rgba(161, 0, 255, 0.15);">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid rgba(161, 0, 255, 0.4);">Opportunity</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid rgba(161, 0, 255, 0.4);">Tags</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid rgba(161, 0, 255, 0.4);">Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${opportunities.slice(0, 10).map(o => `
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px;">${o.oppName}</td>
                <td style="padding: 12px;">${o.tags.join(', ')}</td>
                <td style="padding: 12px;">${Math.round(o.confidence * 100)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${opportunities.length > 10 ? `<p><em>... and ${opportunities.length - 10} more opportunities in the full analysis</em></p>` : ''}

        <h3>Next Steps</h3>
        <ul>
          <li>Review the attached Excel file for complete analysis</li>
          <li>Prioritize high-confidence opportunities for immediate action</li>
          <li>Coordinate with delivery teams on resource allocation</li>
          <li>Schedule follow-up discussions on strategic opportunities</li>
        </ul>

        <p>Best regards,<br/>D&AI Analysis Team</p>
      `
    }
  }

  // Generate emails for each captain
  const emails = []
  for (const [captain, opportunities] of Object.entries(opportunitiesByCaptain)) {
    const emailBody = await generateEmailContent(captain, opportunities)
    
    // Get primary tag for this captain's opportunities
    const tagCounts = { AI: 0, Analytics: 0, Data: 0 }
    opportunities.forEach(o => {
      o.tags.forEach((tag: string) => {
        if (tag in tagCounts) tagCounts[tag as keyof typeof tagCounts]++
      })
    })
    const primaryTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]

    emails.push({
      captain,
      tag: primaryTag,
      subject: `D&AI Opportunity Review - ${captain} (${opportunities.length} Opportunities)`,
      body: emailBody,
      opportunities
    })
  }

  onUpdate?.({
    agent: 'EmailComposerAgent',
    action: `✓ Successfully composed ${emails.length} personalized email(s) for D&AI captain(s)`,
    status: 'complete',
    details: {
      totalEmailsGenerated: emails.length,
      captains: captainNames,
      timestamp: new Date().toISOString()
    }
  })

  return {
    captainEmails: emails
  }
}
