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

    const prompt = `You are writing a brief, direct email about D&AI opportunities for account "${account}".

Context:
- Account: ${account}
- Total Opportunities: ${opportunities.length}
- AI-focused: ${aiOpps.length}
- Analytics-focused: ${analyticsOpps.length}
- Data-focused: ${dataOpps.length}

Opportunities with details:
${opportunities.map(o => `• ${o.opportunityName} → ${o.tags.join(', ')} (${Math.round(o.confidence * 100)}% confidence)${o.dealDescription ? ` - ${o.dealDescription}` : ''}`).join('\n')}

Write a SHORT, DIRECT, CASUAL email with this structure:

Opening: "Found ${opportunities.length} opportunities that are likely Data & AI deals."

List: Show each opportunity with:
- Opportunity name
- Suggested tags (${aiOpps.length > 0 ? 'AI' : ''}${analyticsOpps.length > 0 ? ', Analytics' : ''}${dataOpps.length > 0 ? ', Data' : ''})
- Brief description if available

Closing: "Can you please take a look and tag them appropriately in MMS? Let me know if you need help."

Requirements:
- Keep it brief and conversational, NOT formal
- Use simple HTML formatting (<p>, <ul>, <li>, <strong>)
- Include a simple list or table of opportunities
- Direct tone, like a quick email from a colleague
- Maximum 400 words

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
      
      // Fallback to simple template if LLM fails
      return `
        <p>Found ${opportunities.length} opportunities that are likely Data & AI deals:</p>
        
        <ul style="line-height: 1.8;">
          ${opportunities.map(o => `
            <li>
              <strong>${o.opportunityName}</strong> → ${o.tags.length > 0 ? o.tags.join(', ') : 'Untagged'} 
              (${Math.round(o.confidence * 100)}% confidence)
              ${o.dealDescription ? `<br/><span style="color: rgba(255, 255, 255, 0.7); font-size: 0.9em;">${o.dealDescription}</span>` : ''}
            </li>
          `).join('')}
        </ul>

        <p>Can you please take a look and tag them appropriately in MMS? Let me know if you need help.</p>
        
        <p style="margin-top: 20px; color: rgba(255, 255, 255, 0.6); font-size: 0.85em;">
          Summary: ${aiOpps.length} AI, ${analyticsOpps.length} Analytics, ${dataOpps.length} Data opportunities
        </p>
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
      subject: `${account} - ${opportunities.length} D&AI Opportunities to Tag in MMS`,
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
