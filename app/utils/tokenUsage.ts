/**
 * @fileoverview Shared token usage utilities and types
 * Centralized logic for token usage data handling across components
 */

// ==========================================
// SHARED TYPES & INTERFACES
// ==========================================

export interface TokenCounts {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
}

export interface TokenUsageData {
  id: string
  startTime: string
  endTime?: string
  actualEndTime?: string
  isActive: boolean
  isGap?: boolean
  entries?: number | any[]
  tokenCounts: TokenCounts
  totalTokens: number
  costUSD: number
  models: string[]
  burnRate: number | null
  projection?: any | null
}

// ==========================================
// CORE BUSINESS LOGIC FUNCTIONS
// ==========================================

/**
 * Transforms a session block from ccusage format to our TokenUsageData interface
 * This is the single source of truth for data transformation across all components
 */
export function transformSessionBlock(block: any): TokenUsageData | null {
  if (!block) return null
  
  // Use ccusage's pre-calculated aggregated data (don't recalculate!)
  const tokenCounts = block.tokenCounts || {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0
  }
  
  // Use ccusage's pre-calculated total tokens and cost
  const totalTokens = block.totalTokens || (
    tokenCounts.inputTokens + tokenCounts.outputTokens + 
    tokenCounts.cacheCreationInputTokens + tokenCounts.cacheReadInputTokens
  )
  
  // Use ccusage's pre-calculated cost (don't sum from entries)
  const totalCost = block.costUSD || 0
  
  // Use ccusage's models array (don't extract from entries)
  const models = block.models || []
  
  // Extract burn rate from ccusage's burnRate object
  const burnRatePerMinute = block.burnRate?.tokensPerMinute || 0
  
  return {
    id: block.id,
    startTime: block.startTime,
    endTime: block.endTime,
    actualEndTime: block.actualEndTime,
    isActive: block.isActive,
    isGap: block.isGap,
    entries: Array.isArray(block.entries) ? block.entries.length : (block.entries || 0),
    tokenCounts,
    totalTokens,
    costUSD: totalCost,
    models: Array.from(models),
    burnRate: burnRatePerMinute,
    projection: block.projection || null
  }
}

/**
 * Calculates the percentage completion of a 5-hour billing block
 */
export function calculateBlockPercentage(startTime: string | undefined, isActive: boolean): number {
  if (!isActive || !startTime) return 0
  
  try {
    const start = new Date(startTime).getTime()
    if (isNaN(start)) return 0
    
    const now = Date.now()
    const elapsed = now - start
    const blockDuration = 5 * 60 * 60 * 1000 // 5 hours in ms
    
    return Math.min(100, Math.round((elapsed / blockDuration) * 100))
  } catch {
    return 0
  }
}

// ==========================================
// ACTIVITY LEVEL CALCULATIONS
// ==========================================

export type ActivityLevel = 'Idle' | 'Low' | 'Medium' | 'High' | 'Very High'

/**
 * Determines activity level based on token burn rate
 * Uses consistent thresholds across all components
 */
export function getActivityLevel(rate: number): ActivityLevel {
  if (rate === 0) return 'Idle'
  if (rate < 1000) return 'Low'
  if (rate < 10000) return 'Medium'
  if (rate < 50000) return 'High'
  return 'Very High'
}

/**
 * Gets color class for activity level with different variants
 */
export function getActivityColorClass(
  level: ActivityLevel, 
  variant: 'text' | 'badge' | 'icon' = 'text'
): string {
  const colorMap = {
    'Idle': { 
      text: 'text-gray-500', 
      badge: 'text-gray-600 border-gray-300', 
      icon: 'bg-gray-100 dark:bg-gray-800' 
    },
    'Low': { 
      text: 'text-green-600', 
      badge: 'text-green-600 border-green-300', 
      icon: 'bg-green-100 dark:bg-green-900/30' 
    },
    'Medium': { 
      text: 'text-yellow-600', 
      badge: 'text-yellow-600 border-yellow-300', 
      icon: 'bg-yellow-100 dark:bg-yellow-900/30' 
    },
    'High': { 
      text: 'text-orange-600', 
      badge: 'text-orange-600 border-orange-300', 
      icon: 'bg-orange-100 dark:bg-orange-900/30' 
    },
    'Very High': { 
      text: 'text-red-600', 
      badge: 'text-red-600 border-red-300', 
      icon: 'bg-red-100 dark:bg-red-900/30' 
    }
  }
  
  return colorMap[level]?.[variant] || colorMap['Idle'][variant]
}

// ==========================================
// MODEL UTILITIES
// ==========================================

// Note: formatModelName is available in ~/utils/formatters.ts

// ==========================================
// WEBSOCKET UTILITIES
// ==========================================

/**
 * Standard WebSocket message parser for token usage updates
 * Provides consistent error handling across components
 */
export function parseWebSocketMessage(event: MessageEvent): TokenUsageData | null {
  try {
    const data = JSON.parse(event.data)
    if (data.type === 'tokenUsage' && data.data) {
      return transformSessionBlock(data.data)
    }
    return null
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
    return null
  }
}