/**
 * @fileoverview Token calculation utilities and burn rate calculations
 * Ported from ccusage to provide burn rate functionality
 */

/**
 * Token counts structure for raw usage data
 */
export type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};

/**
 * Represents a session block (typically 5-hour billing period) with usage data
 */
export type SessionBlock = {
  id: string;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  isActive: boolean;
  isGap?: boolean;
  entries: any[];
  tokenCounts: TokenCounts;
  costUSD: number;
  models: string[];
};

/**
 * Represents usage burn rate calculations
 */
type BurnRate = {
  tokensPerMinute: number;
  tokensPerMinuteForIndicator: number;
  costPerHour: number;
};

/**
 * Represents projected usage for remaining time in a session block
 */
type ProjectedUsage = {
  totalTokens: number;
  totalCost: number;
  remainingMinutes: number;
};

/**
 * Calculates the total number of tokens across all token types
 * @param tokenCounts - Object containing counts for each token type
 * @returns Total number of tokens
 */
export function getTotalTokens(tokenCounts: TokenCounts): number {
  return (
    tokenCounts.inputTokens +
    tokenCounts.outputTokens +
    tokenCounts.cacheCreationInputTokens +
    tokenCounts.cacheReadInputTokens
  );
}

/**
 * Calculates the burn rate (tokens/minute and cost/hour) for a session block
 * @param block - Session block to analyze
 * @returns Burn rate calculations or null if block has no activity
 */
export function calculateBurnRate(block: SessionBlock): BurnRate | null {
  if (block.entries.length === 0 || (block.isGap ?? false)) {
    return null;
  }

  const firstEntryData = block.entries[0];
  const lastEntryData = block.entries[block.entries.length - 1];
  if (firstEntryData == null || lastEntryData == null) {
    return null;
  }

  const firstEntry = firstEntryData.timestamp instanceof Date ? firstEntryData.timestamp : new Date(firstEntryData.timestamp);
  const lastEntry = lastEntryData.timestamp instanceof Date ? lastEntryData.timestamp : new Date(lastEntryData.timestamp);
  const durationMinutes = (lastEntry.getTime() - firstEntry.getTime()) / (1000 * 60);

  if (durationMinutes <= 0) {
    return null;
  }

  const totalTokens = getTotalTokens(block.tokenCounts);
  const tokensPerMinute = totalTokens / durationMinutes;

  // For burn rate indicator (HIGH/MODERATE/NORMAL), use only input and output tokens
  // to maintain consistent thresholds with pre-cache behavior
  const nonCacheTokens = (block.tokenCounts.inputTokens ?? 0) + (block.tokenCounts.outputTokens ?? 0);
  const tokensPerMinuteForIndicator = nonCacheTokens / durationMinutes;

  const costPerHour = (block.costUSD / durationMinutes) * 60;

  return {
    tokensPerMinute,
    tokensPerMinuteForIndicator,
    costPerHour,
  };
}

/**
 * Projects total usage for an active session block based on current burn rate
 * @param block - Active session block to project
 * @returns Projected usage totals or null if block is inactive or has no burn rate
 */
export function projectBlockUsage(block: SessionBlock): ProjectedUsage | null {
  if (!block.isActive || (block.isGap ?? false)) {
    return null;
  }

  const burnRate = calculateBurnRate(block);
  if (burnRate == null) {
    return null;
  }

  const now = new Date();
  const remainingTime = block.endTime.getTime() - now.getTime();
  const remainingMinutes = Math.max(0, remainingTime / (1000 * 60));

  const currentTokens = getTotalTokens(block.tokenCounts);
  const projectedAdditionalTokens = burnRate.tokensPerMinute * remainingMinutes;
  const totalTokens = currentTokens + projectedAdditionalTokens;

  const projectedAdditionalCost = (burnRate.costPerHour / 60) * remainingMinutes;
  const totalCost = block.costUSD + projectedAdditionalCost;

  return {
    totalTokens: Math.round(totalTokens),
    totalCost: Math.round(totalCost * 100) / 100,
    remainingMinutes: Math.round(remainingMinutes),
  };
}