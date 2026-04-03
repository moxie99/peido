'use client'

import { useActionState } from 'react'
import { markFeedDepleted } from '@/actions/feed'

export function DepletionForm({ batchId }: { batchId: string }) {
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
