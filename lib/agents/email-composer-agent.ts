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
    action: 'Starting email composition grouped by account',
    status: 'active',
    details: {
      totalOpportunities: state.analyzedOpportunities.length
    }
  })

  // Group opportunities by Account Name
  const opportunitiesByAccount = state.analyzedOpportunities.reduce((acc, opp) => {
    const account = opp.accountName || 'Unknown Account'
    if (!acc[account]) {
      acc[account] = []
    }
    acc[account].push(opp)
    return acc
  }, {} as Record<string, typeof state.analyzedOpportunities>)

  const accountNames = Object.keys(opportunitiesByAccount)

  onUpdate?.({
    agent: 'EmailComposerAgent',
    action: `Identified ${accountNames.length} account(s): ${accountNames.slice(0, 5).join(', ')}${accountNames.length > 5 ? '...' : ''}`,
    status: 'active',
    details: {
      accounts: accountNames,
      opportunitiesPerAccount: Object.entries(opportunitiesByAccount).map(([account, opps]) => ({
        account,
        count: opps.length
      }))
    }
  })

  // Generate email content using LLM for each account
  const generateEmailContent = async (account: string, opportunities: any[]) => {
    // Group by tags for better organization within each account's email
    const aiOpps = opportunities.filter(o => o.tags.includes('AI'))
    const analyticsOpps = opportunities.filter(o => o.tags.includes('Analytics'))
    const dataOpps = opportunities.filter(o => o.tags.includes('Data'))

    // Calculate statistics
    const totalValue = opportunities.reduce((sum, o) => sum + (o.total || 0), 0)
    const avgConfidence = opportunities.reduce((sum, o) => sum + (o.confidence || 0), 0) / opportunities.length

    const prompt = `You are an AI agent writing a professional account review email for "${account}".

Context:
- Account: ${account}
- Total Opportunities: ${opportunities.length}
- AI-focused: ${aiOpps.length}
- Analytics-focused: ${analyticsOpps.length}
- Data-focused: ${dataOpps.length}
${totalValue > 0 ? `- Total Deal Value: $${totalValue.toLocaleString()}` : ''}
- Average Confidence Score: ${Math.round(avgConfidence * 100)}%

Opportunities Details:
${opportunities.slice(0, 10).map(o => `• ${o.opportunityName} (${o.tags.join(', ')}) - Confidence: ${Math.round(o.confidence * 100)}%${o.dealDescription ? ` - ${o.dealDescription.substring(0, 80)}...` : ''}`).join('\n')}
${opportunities.length > 10 ? `\n... and ${opportunities.length - 10} more opportunities` : ''}

Write a professional email with the following structure:
1. **Executive Summary**: Brief overview with key metrics for this account
2. **Opportunity Breakdown**: Organize by AI/Analytics/Data categories
3. **Top Priorities**: Highlight the 3-5 highest-confidence opportunities
4. **Next Steps**: Clear action items for the account team

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
        action: `Generating email content for ${account} (${opportunities.length} opportunities)`,
        status: 'active'
      })

      const llmResponse = await chat.invoke([new HumanMessage(prompt)])
      const emailBody = llmResponse.content.toString()

      onUpdate?.({
        agent: 'EmailComposerAgent',
        action: `✓ Email generated for ${account} (${emailBody.length} chars)`,
        status: 'active',
        details: {
          account,
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
        <h3>Account Review: ${account}</h3>
        <p>This report summarizes ${opportunities.length} D&AI opportunities identified for ${account} from the Communications & Media portfolio.</p>
        
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

  // Generate emails for each account
  const emails = []
  for (const [account, opportunities] of Object.entries(opportunitiesByAccount)) {
    const emailBody = await generateEmailContent(account, opportunities)
    
    // Get primary tag for this account's opportunities
    const tagCounts = { AI: 0, Analytics: 0, Data: 0 }
    opportunities.forEach(o => {
      o.tags.forEach((tag: string) => {
        if (tag in tagCounts) tagCounts[tag as keyof typeof tagCounts]++
      })
    })
    const primaryTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]

    emails.push({
      captain: account, // Keep field name for compatibility, but it's actually account name
      tag: primaryTag,
      subject: `D&AI Opportunity Review - ${account} (${opportunities.length} Opportunities)`,
      body: emailBody,
      opportunities
    })
  }

  onUpdate?.({
    agent: 'EmailComposerAgent',
    action: `✓ Successfully composed ${emails.length} personalized email(s) grouped by account`,
    status: 'complete',
    details: {
      totalEmailsGenerated: emails.length,
      accounts: accountNames,
      timestamp: new Date().toISOString()
    }
  })

  return {
    captainEmails: emails
  }
}
