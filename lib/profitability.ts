export type ProfitabilityStatus = 'profitable' | 'break-even' | 'loss'

/**
 * Compute revenue: total eggs × egg price per unit.
 */
export function computeRevenue(totalEggs: number, eggPrice: number): number {
  return totalEggs * eggPrice
}

/**
 * Compute profit: revenue − total feed cost.
 */
export function computeProfit(revenue: number, totalFeedCost: number): number {
  return revenue - totalFeedCost
}

/**
 * Classify profitability based on profit value.
 * profit > 0  → 'profitable'
 * profit === 0 → 'break-even'
 * profit < 0  → 'loss'
 */
export function classifyProfitability(profit: number): ProfitabilityStatus {
  if (profit > 0) return 'profitable'
  if (profit === 0) return 'break-even'
  return 'loss'
}
