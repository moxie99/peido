import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { SettingsPageContent } from './settings-content'

interface EggPriceRow {
  price: string
  effective_at: string
}

async function getPriceHistory(userId: string): Promise<EggPriceRow[]> {
  return db<EggPriceRow[]>`
    SELECT price, effective_at
    FROM egg_prices
    WHERE user_id = ${userId}
    ORDER BY effective_at DESC
    LIMIT 20
  `
}

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const history = await getPriceHistory(session.userId)

  return <SettingsPageContent history={history} />
}
