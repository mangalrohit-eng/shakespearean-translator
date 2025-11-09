import * as XLSX from 'xlsx'
import { AnalyzedOpportunity } from '../types'

export function createExcelOutput(opportunities: AnalyzedOpportunity[]): Buffer {
  const outputData = opportunities.map(opp => ({
    'Opportunity ID': opp.id,
    'Account Name': opp.accountName,
    'Opportunity Name': opp.opportunityName,
    'Deal Description': opp.dealDescription || '',
    'Industry': opp.industryName || '',
    'Deal Size': opp.dealSize || '',
    'Total': opp.total || '',
    'AI Tag': opp.tags.includes('AI') ? 'Yes' : 'No',
    'Analytics Tag': opp.tags.includes('Analytics') ? 'Yes' : 'No',
    'Data Tag': opp.tags.includes('Data') ? 'Yes' : 'No',
    'Combined Tags': opp.tags.length > 0 ? opp.tags.join(', ') : 'None',
    'Confidence Score': `${opp.confidence}%`,
    'Rationale': opp.rationale,
  }))

  const worksheet = XLSX.utils.json_to_sheet(outputData)
  
  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(outputData[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...outputData.map(row => String(row[key as keyof typeof row]).length)
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tagged Opportunities')
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

