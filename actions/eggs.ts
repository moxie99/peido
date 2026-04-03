'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { FormState } from '@/lib/types'

const UpsertEggRecordSchema = z.object({
  collectionDate: z.string().min(1, { message: 'Collection date is required.' }),
  eggCount: z.coerce
    .number({ message: 'Egg count must be a number.' })
    .int({ message: 'Egg count must be a whole number.' })
    .nonnegative({ message: 'Egg count must be zero or greater.' }),
})

export async function upsertEggRecord(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized.' }
  }

  const parsed = UpsertEggRecordSchema.safeParse({
    collectionDate: formData.get('collectionDate'),
    eggCount: formData.get('eggCount'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { collectionDate, eggCount } = parsed.data

  // Find the active feed batch on the collection date (if any)
  const batchRows = await db`
    SELECT id FROM feed_batches
    WHERE user_id = ${session.userId}
      AND status = 'active'
      AND purchase_date <= ${collectionDate}
    ORDER BY purchase_date ASC
    LIMIT 1
  `

  const feedBatchId = (batchRows[0] as { id: string } | undefined)?.id ?? null

  // Upsert: insert or update on (user_id, collection_date) unique constraint
  await db`
    INSERT INTO egg_records (user_id, collection_date, egg_count, feed_batch_id)
    VALUES (${session.userId}, ${collectionDate}, ${eggCount}, ${feedBatchId})
    ON CONFLICT (user_id, collection_date)
    DO UPDATE SET egg_count = EXCLUDED.egg_count,
                  feed_batch_id = EXCLUDED.feed_batch_id
  `

  redirect('/eggs')
}
