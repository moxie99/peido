import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

interface EggRecordRow {
  id: string
  collection_date: string
  egg_count: number
  feed_type: string | null
}

export default async function EggsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const records = await db<EggRecordRow[]>`
    SELECT er.id, er.collection_date, er.egg_count, fb.feed_type
    FROM egg_records er
    LEFT JOIN feed_batches fb ON er.feed_batch_id = fb.id
    WHERE er.user_id = ${session.userId}
    ORDER BY er.collection_date DESC
    LIMIT 60
  `

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Egg Records</h1>
        <Link
          href="/eggs/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          + Log Eggs
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No egg records yet.{' '}
          <Link href="/eggs/new" className="text-green-600 underline">
            Log today&apos;s count
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Eggs</th>
                <th className="px-4 py-2 font-medium">Feed Batch</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">{r.collection_date}</td>
                  <td className="px-4 py-2">{r.egg_count}</td>
                  <td className="px-4 py-2 text-gray-500">{r.feed_type ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
