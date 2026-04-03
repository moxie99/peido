import { db } from '@/lib/db'
import { computeRevenue, computeProfit, classifyProfitability, type ProfitabilityStatus } from '@/lib/profitability'

export interface FeedBatch {
  id: string
  userId: string
  feedType: string
  quantityKg: number
  totalCost: number
  costPerKg: number
  supplierName: string | null
  purchaseDate: string
  status: 'active' | 'depleted'
  createdAt: string
}

export interface FeedBatchWithCorrelation extends FeedBatch {
  totalEggs: number
  eggYieldRate: number           // eggs per kg
  revenue: number | null         // null if no egg price configured
  profit: number | null
  profitabilityStatus: ProfitabilityStatus | null
  depletionDate: string | null
}

/**
 * Compute egg correlation data for a single feed batch.
 * Queries egg records within [purchaseDate, depletionDate] (or today for active batches).
 * Requires the current egg price to compute revenue/profit.
 */
export async function computeFeedBatchCorrelation(
  batch: FeedBatch,
  userId: string,
  currentEggPrice: number | null
): Promise<FeedBatchWithCorrelation> {
  // Determine the end date for egg aggregation
  let depletionDate: string | null = null

  if (batch.status === 'depleted') {
    const depRows = await db`
      SELECT depletion_date FROM depletion_events
      WHERE feed_batch_id = ${batch.id}
      ORDER BY created_at DESC
      LIMIT 1
    `
    depletionDate = (depRows[0] as { depletion_date: string } | undefined)?.depletion_date ?? null
  }

  const endDate = depletionDate ?? new Date().toISOString().split('T')[0]

  // Sum egg records within the batch period
  const eggRows = await db`
    SELECT COALESCE(SUM(egg_count), 0) AS total_eggs
    FROM egg_records
    WHERE user_id = ${userId}
      AND collection_date >= ${batch.purchaseDate}
      AND collection_date <= ${endDate}
  `

  const totalEggs = Number((eggRows[0] as { total_eggs: string }).total_eggs)
  const eggYieldRate = batch.quantityKg > 0 ? totalEggs / batch.quantityKg : 0

  let revenue: number | null = null
  let profit: number | null = null
  let profitabilityStatus: ProfitabilityStatus | null = null

  if (currentEggPrice !== null) {
    revenue = computeRevenue(totalEggs, currentEggPrice)
    profit = computeProfit(revenue, batch.totalCost)
    profitabilityStatus = classifyProfitability(profit)
  }

  return {
    ...batch,
    totalEggs,
    eggYieldRate,
    revenue,
    profit,
    profitabilityStatus,
    depletionDate,
  }
}
