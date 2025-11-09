import { AnalyzedOpportunity } from '../types'

export interface ClientInsight {
  clientName: string
  total: number
  aiCount: number
  analyticsCount: number
  dataCount: number
  avgConfidence: number
}

export interface ConfidenceDistribution {
  high: number // 80-100%
  medium: number // 50-79%
  low: number // 0-49%
}

export interface TagCoOccurrence {
  combination: string
  count: number
  percentage: number
}

export interface AnalyticsInsights {
  clientBreakdown: ClientInsight[]
  confidenceDistribution: ConfidenceDistribution
  tagCoOccurrence: TagCoOccurrence[]
  topKeywords: { keyword: string; count: number }[]
  averageConfidenceByTag: { tag: string; avgConfidence: number }[]
}

export function generateInsights(opportunities: AnalyzedOpportunity[]): AnalyticsInsights {
  // Client Breakdown
  const clientMap = new Map<string, ClientInsight>()
  
  opportunities.forEach(opp => {
    if (!clientMap.has(opp.accountName)) {
      clientMap.set(opp.accountName, {
        clientName: opp.accountName,
        total: 0,
        aiCount: 0,
        analyticsCount: 0,
        dataCount: 0,
        avgConfidence: 0,
      })
    }
    
    const client = clientMap.get(opp.accountName)!
    client.total++
    
    if (opp.tags.includes('AI')) client.aiCount++
    if (opp.tags.includes('Analytics')) client.analyticsCount++
    if (opp.tags.includes('Data')) client.dataCount++
    client.avgConfidence += opp.confidence
  })
  
  // Calculate average confidence per client
  const clientBreakdown = Array.from(clientMap.values()).map(client => ({
    ...client,
    avgConfidence: Math.round(client.avgConfidence / client.total),
  })).sort((a, b) => b.total - a.total)
  
  // Confidence Distribution
  const confidenceDistribution: ConfidenceDistribution = {
    high: 0,
    medium: 0,
    low: 0,
  }
  
  opportunities.forEach(opp => {
    if (opp.confidence >= 80) confidenceDistribution.high++
    else if (opp.confidence >= 50) confidenceDistribution.medium++
    else confidenceDistribution.low++
  })
  
  // Tag Co-Occurrence
  const coOccurrenceMap = new Map<string, number>()
  
  opportunities.forEach(opp => {
    if (opp.tags.length > 0) {
      const sortedTags = [...opp.tags].sort()
      const key = sortedTags.join(' + ')
      coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1)
    } else {
      coOccurrenceMap.set('None', (coOccurrenceMap.get('None') || 0) + 1)
    }
  })
  
  const tagCoOccurrence = Array.from(coOccurrenceMap.entries())
    .map(([combination, count]) => ({
      combination,
      count,
      percentage: Math.round((count / opportunities.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
  
  // Top Keywords (extract from opportunity names)
  const keywordMap = new Map<string, number>()
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'to', 'in', 'on', 'at', 'of', 'a', 'an']
  
  opportunities.forEach(opp => {
    const words = opp.opportunityName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w))
    
    words.forEach(word => {
      keywordMap.set(word, (keywordMap.get(word) || 0) + 1)
    })
  })
  
  const topKeywords = Array.from(keywordMap.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Average Confidence by Tag
  const tagConfidenceMap = new Map<string, { total: number; count: number }>()
  
  opportunities.forEach(opp => {
    opp.tags.forEach(tag => {
      if (!tagConfidenceMap.has(tag)) {
        tagConfidenceMap.set(tag, { total: 0, count: 0 })
      }
      const tagData = tagConfidenceMap.get(tag)!
      tagData.total += opp.confidence
      tagData.count++
    })
  })
  
  const averageConfidenceByTag = Array.from(tagConfidenceMap.entries())
    .map(([tag, data]) => ({
      tag,
      avgConfidence: Math.round(data.total / data.count),
    }))
    .sort((a, b) => b.avgConfidence - a.avgConfidence)
  
  return {
    clientBreakdown,
    confidenceDistribution,
    tagCoOccurrence,
    topKeywords,
    averageConfidenceByTag,
  }
}

