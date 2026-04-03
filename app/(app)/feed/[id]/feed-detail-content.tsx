'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { markFeedDepleted } from '@/actions/feed'
import { formatCurrency } from '@/lib/utils'
import type { FeedBatchWithCorrelation } from '@/lib/correlation'

function DepletionForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState(markFeedDepleted, undefined)

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="feedBatchId" value={batchId} />
      <div>
        <label htmlFor="depletionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Depletion Date (leave blank for today)
        </label>
        <input
          id="depletionDate"
          name="depletionDate"
          type="date"
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {state?.message && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">{state.message}</p>
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

export function FeedBatchDetailContent({ data }: { data: FeedBatchWithCorrelation }) {
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
        <Row label="Purchase Date" value={data.purchaseDate} />
        {data.depletionDate && <Row label="Depletion Date" value={data.depletionDate} />}
        <Row label="Quantity" value={`${data.quantityKg.toFixed(2)} kg`} />
        <Row label="Total Cost" value={formatCurrency(data.totalCost)} />
        <Row label="Cost per kg" value={formatCurrency(data.costPerKg)} />
        {data.supplierName && <Row label="Supplier" value={data.supplierName} />}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6 space-y-3 mb-6">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Egg Correlation</h2>
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

function Row({
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
