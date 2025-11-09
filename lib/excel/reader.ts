import * as XLSX from 'xlsx'
import { ExcelRow, Opportunity } from '../types'

export function parseExcelFile(buffer: ArrayBuffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)
  return data
}

export function filterCommsMedia(data: ExcelRow[]): Opportunity[] {
  return data
    .filter(row => {
      const clientGroup = row['Client Group'] || ''
      return clientGroup.toLowerCase().includes('comms') || 
             clientGroup.toLowerCase().includes('media')
    })
    .map(row => ({
      id: row.ID || row['Opportunity ID'] || '',
      accountName: row['Account Name'] || row['Client Name'] || '',
      opportunityName: row['Opportunity Name'] || row['Opp Name'] || '',
      dealDescription: row['Deal Description'] || row['Description'] || '',
      industryName: row['Industry'] || row['Client Group'] || '',
      dealSize: row['Deal Size'] || '',
      total: row.Total || 0,
      rawData: row,
    }))
}

