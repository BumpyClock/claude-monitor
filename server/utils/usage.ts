/**
 * Token usage integration module
 * Integrates ccusage functionality into the monitoring dashboard
 */

import { 
  getClaudePaths, 
  loadDailyUsageData, 
  loadMonthlyUsageData,
  loadSessionData,
  loadSessionBlockData
} from 'ccusage/data-loader';
import { 
  calculateBurnRate, 
  projectBlockUsage,
  getTotalTokens
} from './burn-rate-utils';

// Type definitions (imported from ccusage types)
type CostMode = 'auto' | 'calculate' | 'display';
type SortOrder = 'asc' | 'desc';

// Configuration
const DEFAULT_SESSION_DURATION_HOURS = 5;
const DEFAULT_COST_MODE: CostMode = 'auto';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

/**
 * Get daily usage data
 */
export async function getDailyUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  breakdown?: boolean;
  mode?: CostMode;
}) {
  try {
    const data = await loadDailyUsageData({
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      groupByProject: options?.breakdown || false
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading daily usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load daily usage data' 
    };
  }
}

/**
 * Get monthly usage data
 */
export async function getMonthlyUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  breakdown?: boolean;
  mode?: CostMode;
}) {
  try {
    const data = await loadMonthlyUsageData({
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      groupByProject: options?.breakdown || false
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading monthly usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load monthly usage data' 
    };
  }
}

/**
 * Get session usage data
 */
export async function getSessionUsage(options?: {
  since?: string;
  until?: string;
  project?: string;
  mode?: CostMode;
  order?: SortOrder;
}) {
  try {
    const data = await loadSessionData({
      since: options?.since,
      until: options?.until,
      project: options?.project,
      mode: options?.mode || DEFAULT_COST_MODE,
      order: options?.order || DEFAULT_SORT_ORDER
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error loading session usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load session usage data' 
    };
  }
}

/**
 * Get billing blocks usage data
 */
export async function getBlocksUsage(options?: {
  active?: boolean;
  recent?: boolean;
  mode?: CostMode;
  order?: SortOrder;
  tokenLimit?: number | 'max';
}) {
  try {
    let blocks = await loadSessionBlockData({
      sessionDurationHours: DEFAULT_SESSION_DURATION_HOURS,
      mode: options?.mode || DEFAULT_COST_MODE,
      order: options?.order || DEFAULT_SORT_ORDER
    });

    if (options?.active) {
      blocks = blocks.filter(block => block.isActive);
    }

    // Apply token limit filtering if specified
    if (options?.tokenLimit !== undefined && options.tokenLimit !== 'max' && typeof options.tokenLimit === 'number') {
      const tokenLimit = options.tokenLimit as number; // Type assertion after checking
      blocks = blocks.filter(block => {
        const totalTokens = block.tokenCounts.inputTokens + 
          block.tokenCounts.outputTokens + 
          block.tokenCounts.cacheCreationInputTokens + 
          block.tokenCounts.cacheReadInputTokens;
        return totalTokens <= tokenLimit;
      });
    }

    // Add computed fields (same as CLI's JSON output)
    const enrichedBlocks = blocks.map(block => {
      // Transform ccusage block to our SessionBlock type for calculations
      const sessionBlock = {
        id: block.id,
        startTime: block.startTime,
        endTime: block.endTime,
        actualEndTime: block.actualEndTime,
        isActive: block.isActive,
        isGap: block.isGap,
        entries: block.entries,
        tokenCounts: block.tokenCounts,
        costUSD: block.costUSD,
        models: block.models
      };

      const burnRate = block.isActive ? calculateBurnRate(sessionBlock) : null;
      const projection = block.isActive ? projectBlockUsage(sessionBlock) : null;

      return {
        id: block.id,
        startTime: block.startTime.toISOString(),
        endTime: block.endTime.toISOString(),
        actualEndTime: block.actualEndTime?.toISOString(),
        isActive: block.isActive,
        isGap: block.isGap,
        entries: block.entries,
        tokenCounts: block.tokenCounts,
        totalTokens: getTotalTokens(block.tokenCounts),
        costUSD: block.costUSD,
        models: block.models,
        burnRate,
        projection
      };
    });

    return { success: true, data: enrichedBlocks };
  } catch (error) {
    console.error('Error loading blocks usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load blocks usage data' 
    };
  }
}

/**
 * Get live monitoring data for the active block with full aggregation
 */
export async function getLiveBlockData() {
  try {
    const result = await getBlocksUsage({
      active: true,
      mode: DEFAULT_COST_MODE,
      order: DEFAULT_SORT_ORDER
    });
    
    if (!result.success) {
      return result;
    }
    
    // Return the first (and only) active block
    const blocks = result.data;
    const activeBlock = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;
    
    if (!activeBlock) {
      return { 
        success: true, 
        data: null,
        message: 'No active session block' 
      };
    }
    
    return { success: true, data: activeBlock };
  } catch (error) {
    console.error('Error getting live block data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get live monitoring data' 
    };
  }
}

/**
 * Clean up resources
 */
export function cleanup() {
  // Cleanup if needed
}