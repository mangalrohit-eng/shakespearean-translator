// Type definitions for the opportunity analyzer

export interface ExcelRow {
  ID: string
  'Client Name': string
  'Opp Name': string
  Stage: string
  'Fiscal Period': string
  Status: string
  ECSD: string
  MU: string
  'Client Group': string
  'Deal Size': string
  'D&AI %': string
  'Gen AI Value': number
  'D&AI Value': number
  Total: number
  'DAI Captain': string
}

export interface Opportunity {
  id: string
  clientName: string
  oppName: string
  clientGroup: string
  dealSize: string
  total: number
  daiCaptain?: string
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

