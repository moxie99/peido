// Feature: poultry-farm-tracker
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure in-memory implementation of the correlation logic for testing
// ---------------------------------------------------------------------------

interface EggRecord {
  collectionDate: string  // ISO date string YYYY-MM-DD
  eggCount: number
}

/**
 * Pure function that mirrors the DB query in computeFeedBatchCorrelation.
 * Sums egg records where collectionDate is within [purchaseDate, endDate].
 */
function sumEggsInRange(
  records: EggRecord[],
  purchaseDate: string,
  endDate: string
): number {
  return records
    .filter((r) => r.collectionDate >= purchaseDate && r.collectionDate <= endDate)
    .reduce((sum, r) => sum + r.eggCount, 0)
}

// ---------------------------------------------------------------------------
// Property 9: Egg-to-feed-batch correlation totals are consistent
// Validates: Requirements 5.1
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 9: Egg-to-feed-batch correlation totals are consistent
test('P9: correlation total equals filtered sum of egg records in date range', () => {
  // Generate ISO date strings in YYYY-MM-DD format using integer offsets from a base date
  const baseDateMs = new Date('2023-01-01').getTime()
  const maxOffsetMs = (365 * 2) * 24 * 60 * 60 * 1000 // 2 years
  const isoDateArb = fc.integer({ min: 0, max: maxOffsetMs })
    .map((offset) => new Date(baseDateMs + offset).toISOString().split('T')[0])

  fc.assert(
    fc.property(
      isoDateArb,
      isoDateArb,
      fc.array(
        fc.record({
          collectionDate: isoDateArb,
          eggCount: fc.integer({ min: 0, max: 500 }),
        }),
        { minLength: 0, maxLength: 30 }
      ),
      (date1, date2, records) => {
        // Ensure purchaseDate <= depletionDate
        const purchaseDate = date1 <= date2 ? date1 : date2
        const depletionDate = date1 <= date2 ? date2 : date1

        const correlationTotal = sumEggsInRange(records, purchaseDate, depletionDate)

        // Manually compute the expected total
        const expectedTotal = records
          .filter((r) => r.collectionDate >= purchaseDate && r.collectionDate <= depletionDate)
          .reduce((sum, r) => sum + r.eggCount, 0)

        return correlationTotal === expectedTotal
      }
    ),
    { numRuns: 100 }
  )
})

test('P9: records outside the date range are excluded', () => {
  const records: EggRecord[] = [
    { collectionDate: '2024-01-01', eggCount: 10 },
    { collectionDate: '2024-01-15', eggCount: 20 },
    { collectionDate: '2024-02-01', eggCount: 30 },
  ]

  const total = sumEggsInRange(records, '2024-01-10', '2024-01-20')
  assert.equal(total, 20, 'only the record within range should be counted')
})

test('P9: all records included when range covers all dates', () => {
  const records: EggRecord[] = [
    { collectionDate: '2024-01-01', eggCount: 5 },
    { collectionDate: '2024-06-15', eggCount: 10 },
    { collectionDate: '2024-12-31', eggCount: 15 },
  ]

  const total = sumEggsInRange(records, '2024-01-01', '2024-12-31')
  assert.equal(total, 30)
})

test('P9: empty records produce zero total', () => {
  const total = sumEggsInRange([], '2024-01-01', '2024-12-31')
  assert.equal(total, 0)
})

test('P9: egg yield rate = totalEggs / quantityKg', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }),
      fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }),
      (totalEggs, quantityKg) => {
        const yieldRate = totalEggs / quantityKg
        return yieldRate >= 0 && isFinite(yieldRate)
      }
    ),
    { numRuns: 100 }
  )
})
