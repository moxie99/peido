'use client'

import { useActionState } from 'react'
import { updateEggPrice } from '@/actions/settings'

export function SettingsPageContent({
  history,
}: {
  history: { price: string; effective_at: string }[]
}) {
  const currentPrice = history[0]?.price ?? null

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Egg Price</h2>
        {currentPrice && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Current price: <span className="font-semibold text-gray-800 dark:text-white">₦{Number(currentPrice).toFixed(4)}</span> per egg
          </p>
        )}
        <SettingsForm currentPrice={currentPrice} />
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-6">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">Price History</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Set At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 text-gray-800 dark:text-white">₦{Number(h.price).toFixed(4)}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {new Date(h.effective_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SettingsForm({ currentPrice }: { currentPrice: string | null }) {
  const [state, action, pending] = useActionState(updateEggPrice, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Price per Egg (₦) <span className="text-red-500">*</span>
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.0001"
          min="0.0001"
          defaultValue={currentPrice ?? ''}
          required
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {state?.errors?.price && (
          <p className="text-red-600 dark:text-red-400 text-xs mt-1">{state.errors.price[0]}</p>
        )}
      </div>

      {state?.message && (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        {pending ? 'Saving…' : 'Update Price'}
      </button>
    </form>
  )
}
