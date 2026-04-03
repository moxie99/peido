import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { computeFeedBatchCorrelation, type FeedBatch, type FeedBatchWithCorrelation } from '@/lib/correlation'
import { DepletionForm } from './depletion-form'

async function getFeedBatchDetail(id: string, userId: string): Promise<FeedBatchWithCorrelation | null> {
  const rows = await db`
    SELECT id, user_id, feed_type, quantity_kg, total_cost, cost_per_kg,
           supplier_name, purchase_date, status, created_at
    FROM feed_batches
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `

  const row = rows[0] as Record<string, unknown> | undefined
  if (!row) return null

  const batch: FeedBatch = {
    id: row.id as string,
    userId: row.user_id as string,
    feedType: row.feed_type as string,
    quantityKg: Number(row.quantity_kg),
    totalCost: Number(row.total_cost),
    costPerKg: Number(row.cost_per_kg),
    supplierName: row.supplier_name as string | null,
    purchaseDate: row.purchase_date as string,
    status: row.status as 'active' | 'depleted',
    createdAt: row.created_at as string,
  }

  const priceRows = await db`
    SELECT price FROM egg_prices
    WHERE user_id = ${userId}
    ORDER BY effective_at DESC
    LIMIT 1
  `
  const currentEggPrice = priceRows[0]
    ? Number((priceRows[0] as { price: string }).price)
    : null

  return computeFeedBatchCorrelation(batch, userId, currentEggPrice)
}

export default async function FeedBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const data = await getFeedBatchDetail(id, session.userId)
  if (!data) notFound()

  const statusColor =
    data.profitabilityStatus === 'profitable'
      ? 'text-green-600 dark:text-green-400'
      : data.profitabilityStatus === 'loss'
      ? 'text-red-600 dark:text-red-400'
      : 'text-yellow-600 dark:text-yellow-400'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/feed" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
          ← Feed Batches
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">{data.feedType}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Status:{' '}
        <span className={data.status === 'active' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400 font-medium'}>
          {data.status}
        </span>
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6 space-y-3 mb-6">
        <DetailRow label="Purchase Date" value={data.purchaseDate} />
        {data.depletionDate && <DetailRow label="Depletion Date" value={data.depletionDate} />}
        <DetailRow label="Quantity" value={`${data.quantityKg.toFixed(2)} kg`} />
        <DetailRow label="Total Cost" value={`₦${data.totalCost.toFixed(2)}`} />
        <DetailRow label="Cost per kg" value={`₦${data.costPerKg.toFixed(4)}`} />
        {data.supplierName && <DetailRow label="Supplier" value={data.supplierName} />}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6 space-y-3 mb-6">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Egg Correlation</h2>
        <DetailRow label="Total Eggs" value={data.totalEggs.toString()} />
        <DetailRow label="Yield Rate" value={`${data.eggYieldRate.toFixed(2)} eggs/kg`} />
        {data.revenue !== null ? (
          <>
            <DetailRow label="Revenue" value={`₦${data.revenue.toFixed(2)}`} />
            <DetailRow label="Profit" value={`₦${data.profit!.toFixed(2)}`} />
            <DetailRow
              label="Status"
              value={data.profitabilityStatus ?? '—'}
              valueClass={statusColor + ' font-semibold capitalize'}
            />
          </>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <Link href="/settings" className="underline">Set an egg price</Link> to see profitability.
          </p>
        )}
      </div>

      {data.status === 'active' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">Mark as Depleted</h2>
          <DepletionForm batchId={data.id} />
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  valueClass = 'text-gray-800 dark:text-white',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
