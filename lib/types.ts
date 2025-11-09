// Type definitions for the opportunity analyzer

export interface ExcelRow {
  [key: string]: any // Allow any columns since we'll parse dynamically
}

export interface Opportunity {
  id: string
  accountName: string
  opportunityName: string
  dealDescription: string
  industryName?: string
  dealSize?: string
  total?: number
  rawData?: any // Store original row for reference
}

export interface AnalyzedOpportunity extends Opportunity {
  tags: string[]
  rationale: string
  confidence: number
}

export interface CustomInstruction {
  id: string
  text: string
  category: 'AI' | 'Analytics' | 'Data'
  createdAt: string
}

export interface WorkflowState {
  rawData: ExcelRow[]
  filteredOpportunities: Opportunity[]
  analyzedOpportunities: AnalyzedOpportunity[]
  currentStep: string
  totalProcessed: number
  errors: string[]
}

// Column mapping identified by the Excel Parsing Agent
export interface ColumnMapping {
  dealId: string | null
  dealName: string | null
  dealDescription: string | null
  accountName: string | null
  industryName: string | null
}
