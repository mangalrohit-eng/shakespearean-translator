import * as XLSX from 'xlsx'
import { AnalyzedOpportunity } from '../types'

export function createExcelOutput(opportunities: AnalyzedOpportunity[]): Buffer {
  const outputData = opportunities.map(opp => ({
    'Opportunity ID': opp.id,
    'Account Name': opp.accountName,
    'Opportunity Name': opp.opportunityName,
    'Deal Description': opp.dealDescription || '',
    'Industry': opp.industryName || '',
    'Deal Size Category': opp.dealSize || '',
    'Total Value ($)': opp.total || 0,
    'AI Tag': opp.tags.includes('AI') ? 'Yes' : 'No',
    'Gen AI Tag': opp.tags.includes('Gen AI') ? 'Yes' : 'No',
    'Analytics Tag': opp.tags.includes('Analytics') ? 'Yes' : 'No',
    'Data Tag': opp.tags.includes('Data') ? 'Yes' : 'No',
    'Combined Tags': opp.tags.length > 0 ? opp.tags.join(', ') : 'None',
    'Confidence Score': `${opp.confidence}%`,
    'Rationale': opp.rationale,
  }))

  const worksheet = XLSX.utils.json_to_sheet(outputData)
  
  // Format Total Value column as currency
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  const totalValueColIndex = Object.keys(outputData[0] || {}).indexOf('Total Value ($)')
  
  if (totalValueColIndex >= 0) {
    const colLetter = XLSX.utils.encode_col(totalValueColIndex)
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = `${colLetter}${row + 1}`
      const cell = worksheet[cellAddress]
      if (cell && typeof cell.v === 'number') {
        cell.z = '$#,##0.00' // Excel currency format
        cell.t = 'n' // Number type
      }
    }
  }
  
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

