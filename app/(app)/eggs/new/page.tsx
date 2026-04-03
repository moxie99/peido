'use client'

import { useActionState } from 'react'
import { upsertEggRecord } from '@/actions/eggs'

export default function NewEggRecordPage() {
  const [state, action, pending] = useActionState(upsertEggRecord, undefined)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Log Egg Count</h1>

      <form action={action} className="space-y-4 bg-white rounded-lg shadow p-6">
        <div>
          <label htmlFor="collectionDate" className="block text-sm font-medium text-gray-700 mb-1">
            Collection Date <span className="text-red-500">*</span>
          </label>
          <input
            id="collectionDate"
            name="collectionDate"
            type="date"
            defaultValue={today}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.collectionDate && (
            <p className="text-red-600 text-xs mt-1">{state.errors.collectionDate[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="eggCount" className="block text-sm font-medium text-gray-700 mb-1">
            Egg Count <span className="text-red-500">*</span>
          </label>
          <input
            id="eggCount"
            name="eggCount"
            type="number"
            min="0"
            step="1"
            required
            placeholder="0"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.eggCount && (
            <p className="text-red-600 text-xs mt-1">{state.errors.eggCount[0]}</p>
          )}
        </div>

        {state?.message && (
          <p role="alert" className="text-red-600 text-sm">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded text-sm transition-colors"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
