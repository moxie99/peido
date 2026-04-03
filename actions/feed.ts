'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { FormState } from '@/lib/types'

const CreateFeedBatchSchema = z.object({
  feedType: z.string().min(1, { message: 'Feed type is required.' }),
  quantityKg: z.coerce
    .number({ message: 'Quantity must be a number.' })
    .positive({ message: 'Quantity must be greater than zero.' }),
  totalCost: z.coerce
    .number({ message: 'Total cost must be a number.' })
    .nonnegative({ message: 'Total cost must be zero or greater.' }),
  purchaseDate: z.string().min(1, { message: 'Purchase date is required.' }),
  supplierName: z.string().optional(),
})

export async function createFeedBatch(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized.' }
  }

  const parsed = CreateFeedBatchSchema.safeParse({
    feedType: formData.get('feedType'),
    quantityKg: formData.get('quantityKg'),
    totalCost: formData.get('totalCost'),
    purchaseDate: formData.get('purchaseDate'),
    supplierName: formData.get('supplierName') || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { feedType, quantityKg, totalCost, purchaseDate, supplierName } = parsed.data

  await db`
    INSERT INTO feed_batches (user_id, feed_type, quantity_kg, total_cost, supplier_name, purchase_date)
    VALUES (
      ${session.userId},
      ${feedType},
      ${quantityKg},
      ${totalCost},
      ${supplierName ?? null},
      ${purchaseDate}
    )
  `

  redirect('/feed')
}

const MarkDepletedSchema = z.object({
  feedBatchId: z.string().uuid({ message: 'Invalid feed batch ID.' }),
  depletionDate: z.string().optional(),
})

export async function markFeedDepleted(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized.' }
  }

  const parsed = MarkDepletedSchema.safeParse({
    feedBatchId: formData.get('feedBatchId'),
    depletionDate: formData.get('depletionDate') || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { feedBatchId, depletionDate } = parsed.data

  // Verify the batch belongs to this user and is active
  const rows = await db`
    SELECT id, status FROM feed_batches
    WHERE id = ${feedBatchId} AND user_id = ${session.userId}
    LIMIT 1
  `

  const batch = rows[0] as { id: string; status: string } | undefined

  if (!batch) {
    return { message: 'Feed batch not found.' }
  }

  if (batch.status === 'depleted') {
    return { message: 'This feed batch has already been marked as depleted.' }
  }

  const resolvedDate = depletionDate ?? new Date().toISOString().split('T')[0]

  // Wrap in a transaction: insert depletion event + update status atomically
  await db.begin(async (tx) => {
    await tx`
      INSERT INTO depletion_events (feed_batch_id, depletion_date)
      VALUES (${feedBatchId}, ${resolvedDate})
    `
    await tx`
      UPDATE feed_batches SET status = 'depleted'
      WHERE id = ${feedBatchId} AND user_id = ${session.userId}
    `
  })

  redirect(`/feed/${feedBatchId}`)
}
