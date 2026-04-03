import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

interface FeedBatchRow {
  id: string
  feed_type: string
  quantity_kg: string
  total_cost: string
  purchase_date: string
  status: string
  supplier_name: string | null
}

export default async function FeedPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const batches = await db<FeedBatchRow[]>`
    SELECT id, feed_type, quantity_kg, total_cost, purchase_date, status, supplier_name
    FROM feed_batches
    WHERE user_id = ${session.userId}
    ORDER BY purchase_date ASC
  `

  const activeBatches = batches.filter((b) => b.status === 'active')
  const depletedBatches = batches.filter((b) => b.status === 'depleted')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Feed Batches</h1>
        <Link
          href="/feed/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          + Log Feed
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Active</h2>
        {activeBatches.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No feed currently in stock.{' '}
            <Link href="/feed/new" className="text-green-600 underline">
              Log a new batch
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Feed Type</th>
                  <th className="px-4 py-2 font-medium">Qty (kg)</th>
                  <th className="px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2 font-medium">Purchase Date</th>
                  <th className="px-4 py-2 font-medium">Supplier</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {activeBatches.map((b) => (
                  <tr key={b.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">{b.feed_type}</td>
                    <td className="px-4 py-2">{Number(b.quantity_kg).toFixed(2)}</td>
                    <td className="px-4 py-2">${Number(b.total_cost).toFixed(2)}</td>
                    <td className="px-4 py-2">{b.purchase_date}</td>
                    <td className="px-4 py-2">{b.supplier_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <Link href={`/feed/${b.id}`} className="text-green-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {depletedBatches.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-gray-700 mb-3">Depleted</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600">
                  <th className="px-4 py-2 font-medium">Feed Type</th>
                  <th className="px-4 py-2 font-medium">Qty (kg)</th>
                  <th className="px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2 font-medium">Purchase Date</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {depletedBatches.map((b) => (
                  <tr key={b.id} className="border-t border-gray-200 text-gray-500">
                    <td className="px-4 py-2">{b.feed_type}</td>
                    <td className="px-4 py-2">{Number(b.quantity_kg).toFixed(2)}</td>
                    <td className="px-4 py-2">${Number(b.total_cost).toFixed(2)}</td>
                    <td className="px-4 py-2">{b.purchase_date}</td>
                    <td className="px-4 py-2">
                      <Link href={`/feed/${b.id}`} className="text-green-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
