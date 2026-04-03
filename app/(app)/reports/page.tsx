import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { computeRevenue, computeProfit, classifyProfitability } from '@/lib/profitability'
import { formatCurrency } from '@/lib/utils'

interface FeedBatchRow {
  id: string
  feed_type: string
  quantity_kg: string
  total_cost: string
  purchase_date: string
  status: string
  supplier_name: string | null
}

interface EggRecordRow {
  collection_date: string
  egg_count: string
}

interface ReportData {
  feedBatches: FeedBatchRow[]
  totalFeedCost: number
  totalEggs: number
  totalRevenue: number | null
  netProfit: number | null
  profitabilityStatus: 'profitable' | 'break-even' | 'loss' | null
  feedTypes: string[]
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

async function getReportData(
  userId: string,
  startDate: string,
  endDate: string,
  feedType: string | null
): Promise<ReportData> {
  let feedBatches: FeedBatchRow[]

  if (feedType) {
    feedBatches = await db<FeedBatchRow[]>`
      SELECT id, feed_type, quantity_kg, total_cost, purchase_date, status, supplier_name
      FROM feed_batches
      WHERE user_id = ${userId}
        AND purchase_date >= ${startDate}
        AND purchase_date <= ${endDate}
        AND feed_type = ${feedType}
      ORDER BY purchase_date DESC
    `
  } else {
    feedBatches = await db<FeedBatchRow[]>`
      SELECT id, feed_type, quantity_kg, total_cost, purchase_date, status, supplier_name
      FROM feed_batches
      WHERE user_id = ${userId}
        AND purchase_date >= ${startDate}
        AND purchase_date <= ${endDate}
      ORDER BY purchase_date DESC
    `
  }

  const eggRecords = await db<EggRecordRow[]>`
    SELECT collection_date, egg_count FROM egg_records
    WHERE user_id = ${userId}
      AND collection_date >= ${startDate}
      AND collection_date <= ${endDate}
  `

  const totalFeedCost = feedBatches.reduce((sum, b) => sum + Number(b.total_cost), 0)
  const totalEggs = eggRecords.reduce((sum, r) => sum + Number(r.egg_count), 0)

  const feedTypes = await db<{ feed_type: string }[]>`
    SELECT DISTINCT feed_type FROM feed_batches
    WHERE user_id = ${userId}
    ORDER BY feed_type ASC
  `

  const eggPrice = await getCurrentEggPrice(userId)
  let totalRevenue: number | null = null
  let netProfit: number | null = null
  let profitabilityStatus: 'profitable' | 'break-even' | 'loss' | null = null

  if (eggPrice !== null && totalEggs > 0) {
    totalRevenue = computeRevenue(totalEggs, eggPrice)
    netProfit = computeProfit(totalRevenue, totalFeedCost)
    profitabilityStatus = classifyProfitability(netProfit)
  }

  return {
    feedBatches,
    totalFeedCost,
    totalEggs,
    totalRevenue,
    netProfit,
    profitabilityStatus,
    feedTypes: feedTypes.map((t) => t.feed_type),
  }
}

function ReportFilters({
  feedTypes,
  defaultStart,
  defaultEnd,
  defaultFeedType,
}: {
  feedTypes: string[]
  defaultStart: string
  defaultEnd: string
  defaultFeedType: string
}) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultStart}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={defaultEnd}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="feedType" className="block text-sm font-medium text-gray-700 mb-1">
            Feed Type (optional)
          </label>
          <select
            id="feedType"
            name="feedType"
            defaultValue={defaultFeedType}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            {feedTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        Generate Report
      </button>
    </form>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; feedType?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const startDate = params.startDate || ''
  const endDate = params.endDate || ''
  const feedType = params.feedType || ''

  const eggPrice = await getCurrentEggPrice(session.userId)
  const feedTypesData = await db<{ feed_type: string }[]>`
    SELECT DISTINCT feed_type FROM feed_batches
    WHERE user_id = ${session.userId}
    ORDER BY feed_type ASC
  `
  const feedTypes = feedTypesData.map((t) => t.feed_type)

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultEnd = now.toISOString().split('T')[0]

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <ReportFilters
          feedTypes={feedTypes}
          defaultStart={startDate || defaultStart}
          defaultEnd={endDate || defaultEnd}
          defaultFeedType={feedType}
        />
      </div>

      {startDate && endDate ? (
        <ReportResults
          startDate={startDate}
          endDate={endDate}
          feedType={feedType}
          eggPrice={eggPrice}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">
            Select a date range and click Generate Report to view data.
          </p>
        </div>
      )}
    </div>
  )
}

async function ReportResults({
  startDate,
  endDate,
  feedType,
  eggPrice,
}: {
  startDate: string
  endDate: string
  feedType: string
  eggPrice: number | null
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getReportData(session.userId, startDate, endDate, feedType || null)

  return (
    <>
      {!eggPrice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Please set your egg price to enable profitability calculations.{' '}
            <Link href="/settings" className="underline font-medium">
              Set price
            </Link>
          </p>
        </div>
      )}

      {data.feedBatches.length === 0 && data.totalEggs === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">
            No records found for the selected date range.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500 mb-1">Total Feed Cost</p>
              <p className="text-2xl font-semibold text-gray-800">
                                {formatCurrency(data.totalFeedCost)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500 mb-1">Total Eggs</p>
              <p className="text-2xl font-semibold text-gray-800">{data.totalEggs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.totalRevenue !== null ? formatCurrency(data.totalRevenue) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500 mb-1">Net Profit</p>
              {data.netProfit !== null ? (
                <p
                  className={`text-2xl font-semibold ${
                    data.profitabilityStatus === 'profitable'
                      ? 'text-green-600'
                      : data.profitabilityStatus === 'break-even'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Math.abs(data.netProfit))}{' '}
                  {data.netProfit < 0 && '(Loss)'}
                </p>
              ) : (
                <p className="text-2xl font-semibold text-gray-400">—</p>
              )}
            </div>
          </div>

          {data.feedBatches.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Feed Batches</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-600">
                      <th className="px-4 py-2 font-medium">Feed Type</th>
                      <th className="px-4 py-2 font-medium">Qty (kg)</th>
                      <th className="px-4 py-2 font-medium">Cost</th>
                      <th className="px-4 py-2 font-medium">Purchase Date</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.feedBatches.map((b) => (
                      <tr key={b.id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{b.feed_type}</td>
                        <td className="px-4 py-2">{Number(b.quantity_kg).toFixed(2)}</td>
                        <td className="px-4 py-2">{formatCurrency(Number(b.total_cost))}</td>
                        <td className="px-4 py-2">{b.purchase_date}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              b.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
