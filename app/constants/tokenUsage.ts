/**
 * @fileoverview Token usage constants and configuration
 * Centralized constants to eliminate magic numbers across components
 */

// ==========================================
// TIME CONSTANTS
// ==========================================

/** Duration of a Claude billing block in milliseconds (5 hours) */
export const BLOCK_DURATION_MS = 5 * 60 * 60 * 1000

/** Update intervals for various UI components */
export const UPDATE_INTERVALS = {
  /** Duration display update frequency (1 second) */
  DURATION: 1000,
  /** Live activity monitoring frequency (2 seconds) */
  ACTIVITY: 2000,
  /** Token usage data refresh frequency (5 seconds) */
  TOKEN_REFRESH: 5000
} as const

// ==========================================
// ACTIVITY LEVEL THRESHOLDS
// ==========================================

/** Token burn rate thresholds for activity level classification */
export const ACTIVITY_THRESHOLDS = {
  /** Low activity threshold (tokens per minute) */
  LOW: 1000,
  /** Medium activity threshold (tokens per minute) */
  MEDIUM: 10000,
  /** High activity threshold (tokens per minute) */
  HIGH: 50000
} as const

// ==========================================
// CHART CONFIGURATION
// ==========================================

/** Standard color palette for charts and visualizations */
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green  
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1'  // indigo
] as const

/** Chart dimension presets for different use cases */
export const CHART_DIMENSIONS = {
  /** Compact chart dimensions (for cards, modals) */
  COMPACT: { width: 160, height: 160 },
  /** Standard chart dimensions (for detailed views) */
  STANDARD: { width: 280, height: 280 },
  /** Live activity chart dimensions */
  ACTIVITY: { width: 400, height: 96 }
} as const

// ==========================================
// UI CONFIGURATION
// ==========================================

/** Maximum number of characters for truncated text displays */
export const MAX_TEXT_LENGTH = {
  /** Model name display in cards */
  MODEL_NAME: 20,
  /** Session ID display */
  SESSION_ID: 8,
  /** General text truncation */
  GENERAL: 50
} as const

/** Time range options for live activity monitoring */
export const TIME_RANGES = ['15s', '30s', '1m', '3m', '5m'] as const

// ==========================================
// TYPE EXPORTS FOR CONSTANTS
// ==========================================

export type TimeRange = typeof TIME_RANGES[number]
export type ChartColor = typeof CHART_COLORS[number]