'use client'

import { useActionState } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { computeFeedBatchCorrelation, type FeedBatch } from '@/lib/correlation'
import { markFeedDepleted } from '@/actions/feed'
import { formatCurrency } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getFeedBatchDetail(id: string, userId: string) {
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

  // Get current egg price
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

function DepletionForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState(markFeedDepleted, undefined)

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="feedBatchId" value={batchId} />
      <div>
        <label htmlFor="depletionDate" className="block text-sm font-medium text-gray-700 mb-1">
          Depletion Date (leave blank for today)
        </label>
        <input
          id="depletionDate"
          name="depletionDate"
          type="date"
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {state?.message && (
        <p role="alert" className="text-red-600 text-sm">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        {pending ? 'Marking…' : 'Mark as Depleted'}
      </button>
    </form>
  )
}

export default async function FeedBatchDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const data = await getFeedBatchDetail(id, session.userId)
  if (!data) notFound()

  const statusColor =
    data.profitabilityStatus === 'profitable'
      ? 'text-green-600'
      : data.profitabilityStatus === 'loss'
      ? 'text-red-600'
      : 'text-yellow-600'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/feed" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Feed Batches
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 mb-1">{data.feedType}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Status:{' '}
        <span className={data.status === 'active' ? 'text-green-600 font-medium' : 'text-gray-500 font-medium'}>
          {data.status}
        </span>
      </p>

      <div className="bg-white rounded-lg shadow p-6 space-y-3 mb-6">
        <Row label="Purchase Date" value={data.purchaseDate} />
        {data.depletionDate && <Row label="Depletion Date" value={data.depletionDate} />}
        <Row label="Quantity" value={`${data.quantityKg.toFixed(2)} kg`} />
        <Row label="Total Cost" value={formatCurrency(data.totalCost)} />
        <Row label="Cost per kg" value={formatCurrency(data.costPerKg)} />
        {data.supplierName && <Row label="Supplier" value={data.supplierName} />}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-3 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Egg Correlation</h2>
        <Row label="Total Eggs" value={data.totalEggs.toString()} />
        <Row label="Yield Rate" value={`${data.eggYieldRate.toFixed(2)} eggs/kg`} />
        {data.revenue !== null ? (
          <>
            <Row label="Revenue" value={formatCurrency(data.revenue)} />
            <Row label="Profit" value={formatCurrency(data.profit!)} />
            <Row
              label="Status"
              value={data.profitabilityStatus ?? '—'}
              valueClass={statusColor + ' font-semibold capitalize'}
            />
          </>
        ) : (
          <p className="text-sm text-amber-600">
            <Link href="/settings" className="underline">Set an egg price</Link> to see profitability.
          </p>
        )}
      </div>

      {data.status === 'active' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-700">Mark as Depleted</h2>
          <DepletionForm batchId={data.id} />
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  valueClass = 'text-gray-800',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
