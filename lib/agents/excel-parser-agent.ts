import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import { WorkflowState, ColumnMapping, Opportunity } from '../types'

const chat = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.1, // Very low temperature for deterministic parsing
})

export async function excelParserAgent(
  state: WorkflowState,
  onUpdate?: (log: any) => void
): Promise<Partial<WorkflowState>> {
  onUpdate?.({
    agent: 'ExcelParserAgent',
    action: `Analyzing Excel structure with ${state.rawData.length} rows`,
    status: 'active',
    details: {
      totalRows: state.rawData.length
    }
  })

  try {
    // Get column names from first row
    const sampleRow = state.rawData[0]
    const columnNames = Object.keys(sampleRow)

    onUpdate?.({
      agent: 'ExcelParserAgent',
      action: `Detected ${columnNames.length} columns in Excel file`,
      status: 'active',
      details: {
        columns: columnNames
      }
    })

    // Use LLM to intelligently map columns
    const prompt = `You are an Excel parsing expert. Analyze these column names and identify which columns contain specific data fields.

Column names detected:
${columnNames.map((col, idx) => `${idx + 1}. "${col}"`).join('\n')}

Sample data from first row:
${columnNames.map(col => `"${col}": "${sampleRow[col]}"`).join('\n')}

Your task: Identify which columns contain the following information:
1. **Deal ID / Opportunity ID**: Unique identifier (often numeric or alphanumeric code)
2. **Deal Name / Opportunity Name**: The name or title of the opportunity/deal
3. **Deal Description**: Detailed description of what the opportunity involves
4. **Account Name / Client Name**: The customer/client/account name
5. **Industry Name / Client Group**: Industry classification or group

Rules:
- Look for exact matches first, then semantic matches
- Column names might have variations (e.g., "Opp Name" vs "Opportunity Name")
- Some columns might not exist (return null if not found)
- Consider the sample data values to confirm your identification

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "dealId": "exact column name or null",
  "dealName": "exact column name or null",
  "dealDescription": "exact column name or null",
  "accountName": "exact column name or null",
  "industryName": "exact column name or null"
}`

    const llmResponse = await chat.invoke([new HumanMessage(prompt)])
    const responseText = llmResponse.content.toString().trim()
    
    // Parse LLM response
    let columnMapping: ColumnMapping
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      columnMapping = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText)
      throw new Error('LLM response was not valid JSON')
    }

    onUpdate?.({
      agent: 'ExcelParserAgent',
      action: `✓ Column mapping identified successfully`,
      status: 'active',
      details: {
        mapping: columnMapping,
        dealIdColumn: columnMapping.dealId || 'NOT FOUND',
        dealNameColumn: columnMapping.dealName || 'NOT FOUND',
        dealDescriptionColumn: columnMapping.dealDescription || 'NOT FOUND',
        accountNameColumn: columnMapping.accountName || 'NOT FOUND'
      }
    })

    // Validate required fields
    if (!columnMapping.dealName || !columnMapping.accountName) {
      throw new Error('Could not identify required columns (deal name and account name)')
    }

    // Parse rows into structured Opportunity objects
    const opportunities: Opportunity[] = state.rawData.map((row, index) => {
      const opp: Opportunity = {
        id: columnMapping.dealId ? String(row[columnMapping.dealId] || `AUTO_${index + 1}`) : `AUTO_${index + 1}`,
        opportunityName: columnMapping.dealName ? String(row[columnMapping.dealName] || '') : '',
        dealDescription: columnMapping.dealDescription ? String(row[columnMapping.dealDescription] || '') : '',
        accountName: columnMapping.accountName ? String(row[columnMapping.accountName] || 'Unknown Account') : 'Unknown Account',
        industryName: columnMapping.industryName ? String(row[columnMapping.industryName] || '') : '',
        rawData: row
      }
      return opp
    }).filter(opp => opp.opportunityName && opp.opportunityName.trim() !== '')

    onUpdate?.({
      agent: 'ExcelParserAgent',
      action: `✓ Parsed ${opportunities.length} valid opportunities from ${state.rawData.length} rows`,
      status: 'complete',
      details: {
        totalParsed: opportunities.length,
        skipped: state.rawData.length - opportunities.length,
        sampleOpportunities: opportunities.slice(0, 3).map(o => ({
          id: o.id,
          name: o.opportunityName,
          account: o.accountName
        }))
      }
    })

    // Since all data is C&M, we don't need to filter - just use parsed opportunities
    return {
      filteredOpportunities: opportunities,
      currentStep: 'parsing_complete'
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    onUpdate?.({
      agent: 'ExcelParserAgent',
      action: `✗ Error parsing Excel: ${errorMsg}`,
      status: 'error',
      details: { error: errorMsg }
    })

    return {
      currentStep: 'error',
      errors: [...state.errors, `ExcelParserAgent: ${errorMsg}`]
    }
  }
}

