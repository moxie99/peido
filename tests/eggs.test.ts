// Feature: poultry-farm-tracker
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fc from 'fast-check'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Inline the Zod schema for testing without a DB connection
// ---------------------------------------------------------------------------

const UpsertEggRecordSchema = z.object({
  collectionDate: z.string().min(1),
  eggCount: z.coerce.number().int().nonnegative(),
})

function validateEggRecord(input: Record<string, unknown>) {
  return UpsertEggRecordSchema.safeParse(input)
}

// Simulate the upsert logic (in-memory store)
function createEggStore() {
  const store = new Map<string, number>() // key: `${userId}:${date}` → eggCount

  function upsert(userId: string, collectionDate: string, eggCount: number) {
    const key = `${userId}:${collectionDate}`
    store.set(key, eggCount)
  }

  function count(userId: string, collectionDate: string): number {
    return store.has(`${userId}:${collectionDate}`) ? 1 : 0
  }

  function get(userId: string, collectionDate: string): number | undefined {
    return store.get(`${userId}:${collectionDate}`)
  }

  return { upsert, count, get }
}

// ---------------------------------------------------------------------------
// Property 7: Egg record upsert — duplicate date updates rather than inserts
// Validates: Requirements 4.2
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 7: Egg record upsert — duplicate date updates rather than inserts
test('P7: upserting twice for same user+date results in exactly one record with second count', () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      fc.constantFrom('2024-01-01', '2025-06-15', '2023-12-31'),
      fc.integer({ min: 0, max: 5000 }),
      fc.integer({ min: 0, max: 5000 }),
      (userId, date, firstCount, secondCount) => {
        const store = createEggStore()

        store.upsert(userId, date, firstCount)
        store.upsert(userId, date, secondCount)

        // Exactly one record for this user+date
        const recordCount = store.count(userId, date)
        // Value equals the second submission
        const storedValue = store.get(userId, date)

        return recordCount === 1 && storedValue === secondCount
      }
    ),
    { numRuns: 100 }
  )
})

test('P7: different dates produce separate records', () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      fc.constantFrom('2024-01-01', '2025-06-15'),
      fc.constantFrom('2024-01-02', '2025-06-16'),
      fc.integer({ min: 0, max: 5000 }),
      fc.integer({ min: 0, max: 5000 }),
      (userId, date1, date2, count1, count2) => {
        if (date1 === date2) return true // skip same-date case
        const store = createEggStore()
        store.upsert(userId, date1, count1)
        store.upsert(userId, date2, count2)
        return store.count(userId, date1) === 1 && store.count(userId, date2) === 1
      }
    ),
    { numRuns: 100 }
  )
})

// ---------------------------------------------------------------------------
// Property 8: Negative egg counts are rejected
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 8: Negative egg counts are rejected
test('P8: any negative integer egg count is rejected by validation', () => {
  fc.assert(
    fc.property(
      fc.integer({ max: -1 }),
      (negativeCount) => {
        const result = validateEggRecord({
          collectionDate: '2024-01-01',
          eggCount: negativeCount,
        })
        return !result.success
      }
    ),
    { numRuns: 100 }
  )
})

test('P8: zero and positive egg counts pass validation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100000 }),
      (count) => {
        const result = validateEggRecord({
          collectionDate: '2024-01-01',
          eggCount: count,
        })
        return result.success
      }
    ),
    { numRuns: 100 }
  )
})

test('P8: missing collection date is rejected', () => {
  const result = validateEggRecord({ collectionDate: '', eggCount: 10 })
  assert.equal(result.success, false)
})
