'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { FormState } from '@/lib/types'

const UpdateEggPriceSchema = z.object({
  price: z.coerce
    .number({ message: 'Price must be a number.' })
    .positive({ message: 'Price must be greater than zero.' }),
})

export async function updateEggPrice(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized.' }
  }

  const parsed = UpdateEggPriceSchema.safeParse({
    price: formData.get('price'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { price } = parsed.data

  // Append-only: always insert a new row, never update existing rows
  await db`
    INSERT INTO egg_prices (user_id, price)
    VALUES (${session.userId}, ${price})
  `

  redirect('/settings')
}
