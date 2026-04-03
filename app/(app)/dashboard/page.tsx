import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { computeRevenue, computeProfit, classifyProfitability } from '@/lib/profitability'
import { formatCurrency } from '@/lib/utils'

interface DashboardData {
  activeBatchCount: number
  totalFeedCostThisMonth: number
  totalEggsThisMonth: number
  currentMonthProfit: number | null
  currentMonthStatus: 'profitable' | 'break-even' | 'loss' | null
  last7DaysEggs: { date: string; count: number }[]
}

async function getCurrentEggPrice(userId: string): Promise<number | null> {
  const rows = await db<{ price: string }[]>`
    SELECT price FROM egg_prices
    WHERE user_id = ${userId}
    ORDER BY effective_at DESC
    LIMIT 1
  `
  return rows[0] ? Number(rows[0].price) : null
}

async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]
  
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [activeBatchRows, feedCostRows, eggCountRows, last7DaysRows] = await Promise.all([
    db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM feed_batches
      WHERE user_id = ${userId} AND status = 'active'
    `,
    db<{ total: string }[]>`
      SELECT COALESCE(SUM(total_cost), 0)::text AS total FROM feed_batches
      WHERE user_id = ${userId}
        AND purchase_date >= ${startOfMonth}
        AND purchase_date <= ${endOfMonth}
    `,
    db<{ total: string }[]>`
      SELECT COALESCE(SUM(egg_count), 0)::text AS total FROM egg_records
      WHERE user_id = ${userId}
        AND collection_date >= ${startOfMonth}
        AND collection_date <= ${endOfMonth}
    `,
    db<{ collection_date: string; egg_count: string }[]>`
      SELECT collection_date, egg_count FROM egg_records
      WHERE user_id = ${userId}
        AND collection_date <= ${today}
        AND collection_date >= ${sevenDaysAgoStr}
      ORDER BY collection_date DESC
    `,
  ])

  const activeBatchCount = Number(activeBatchRows[0].count)
  const totalFeedCostThisMonth = Number(feedCostRows[0].total)
  const totalEggsThisMonth = Number(eggCountRows[0].total)

  const eggPrice = await getCurrentEggPrice(userId)
  let currentMonthProfit: number | null = null
  let currentMonthStatus: 'profitable' | 'break-even' | 'loss' | null = null

  if (eggPrice !== null && totalEggsThisMonth > 0) {
    const revenue = computeRevenue(totalEggsThisMonth, eggPrice)
    currentMonthProfit = computeProfit(revenue, totalFeedCostThisMonth)
    currentMonthStatus = classifyProfitability(currentMonthProfit)
  }

  const last7DaysEggs = last7DaysRows.map((row) => ({
    date: row.collection_date,
    count: Number(row.egg_count),
  }))

  return {
    activeBatchCount,
    totalFeedCostThisMonth,
    totalEggsThisMonth,
    currentMonthProfit,
    currentMonthStatus,
    last7DaysEggs,
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getDashboardData(session.userId)
  const eggPrice = await getCurrentEggPrice(session.userId)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Dashboard</h1>

      {!eggPrice && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please set your egg price to enable profitability calculations.{' '}
            <Link href="/settings" className="underline font-medium">
              Set price
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Feed Batches</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-white">{data.activeBatchCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Feed Cost This Month</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-white">
            {formatCurrency(data.totalFeedCostThisMonth)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Eggs This Month</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-white">{data.totalEggsThisMonth}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Month Status</p>
          {data.currentMonthStatus ? (
            <p
              className={`text-2xl font-semibold ${
                data.currentMonthStatus === 'profitable'
                  ? 'text-green-600 dark:text-green-400'
                  : data.currentMonthStatus === 'break-even'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {data.currentMonthStatus === 'profitable' && 'Profitable'}
              {data.currentMonthStatus === 'break-even' && 'Break-even'}
              {data.currentMonthStatus === 'loss' && 'Loss'}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-gray-400 dark:text-gray-500">—</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Last 7 Days Egg Production</h2>
        {data.last7DaysEggs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No egg records for the last 7 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Eggs Collected</th>
                </tr>
              </thead>
              <tbody>
                {data.last7DaysEggs.map((row) => (
                  <tr key={row.date} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{row.date}</td>
                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
