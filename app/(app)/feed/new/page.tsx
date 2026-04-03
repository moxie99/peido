'use client'

import { useActionState } from 'react'
import { createFeedBatch } from '@/actions/feed'

export default function NewFeedBatchPage() {
  const [state, action, pending] = useActionState(createFeedBatch, undefined)

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Log Feed Batch</h1>

      <form action={action} className="space-y-4 bg-white rounded-lg shadow p-6">
        <div>
          <label htmlFor="feedType" className="block text-sm font-medium text-gray-700 mb-1">
            Feed Type <span className="text-red-500">*</span>
          </label>
          <input
            id="feedType"
            name="feedType"
            type="text"
            required
            placeholder="e.g. Layer Mash"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.feedType && (
            <p className="text-red-600 text-xs mt-1">{state.errors.feedType[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="quantityKg" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity (kg) <span className="text-red-500">*</span>
          </label>
          <input
            id="quantityKg"
            name="quantityKg"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.quantityKg && (
            <p className="text-red-600 text-xs mt-1">{state.errors.quantityKg[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 mb-1">
            Total Cost (₦) <span className="text-red-500">*</span>
          </label>
          <input
            id="totalCost"
            name="totalCost"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.totalCost && (
            <p className="text-red-600 text-xs mt-1">{state.errors.totalCost[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Date <span className="text-red-500">*</span>
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.purchaseDate && (
            <p className="text-red-600 text-xs mt-1">{state.errors.purchaseDate[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
            Supplier (optional)
          </label>
          <input
            id="supplierName"
            name="supplierName"
            type="text"
            placeholder="Supplier name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {state?.message && (
          <p role="alert" className="text-red-600 text-sm">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded text-sm transition-colors"
        >
          {pending ? 'Saving…' : 'Save Feed Batch'}
        </button>
      </form>
    </div>
  )
}
