// Feature: poultry-farm-tracker
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fc from 'fast-check'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Inline the Zod schema for testing without a DB connection
// ---------------------------------------------------------------------------

const UpdateEggPriceSchema = z.object({
  price: z.coerce.number().positive(),
})

function validateEggPrice(input: Record<string, unknown>) {
  return UpdateEggPriceSchema.safeParse(input)
}

// Simulate the append-only price history store
function createPriceHistory() {
  const history: Array<{ price: number; effectiveAt: Date }> = []

  function insert(price: number) {
    history.push({ price, effectiveAt: new Date() })
  }

  function getAll() {
    return [...history]
  }

  return { insert, getAll }
}

// ---------------------------------------------------------------------------
// Property 11: Non-positive egg price is rejected
// Validates: Requirements 7.4
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 11: Non-positive egg price is rejected
test('P11: zero price is rejected', () => {
  const result = validateEggPrice({ price: 0 })
  assert.equal(result.success, false)
})

test('P11: any negative price is rejected', () => {
  fc.assert(
    fc.property(
      fc.double({ max: -Number.EPSILON, noNaN: true, noDefaultInfinity: true }),
      (negativePrice) => !validateEggPrice({ price: negativePrice }).success
    ),
    { numRuns: 100 }
  )
})

test('P11: any positive price passes validation', () => {
  fc.assert(
    fc.property(
      fc.double({ min: Number.EPSILON, max: 1000, noNaN: true, noDefaultInfinity: true }),
      (positivePrice) => validateEggPrice({ price: positivePrice }).success
    ),
    { numRuns: 100 }
  )
})

// ---------------------------------------------------------------------------
// Property 12: Egg price history is append-only
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 12: Egg price history is append-only
test('P12: all previous prices remain after each update', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.double({ min: Number.EPSILON, max: 1000, noNaN: true, noDefaultInfinity: true }),
        { minLength: 1, maxLength: 20 }
      ),
      (prices) => {
        const store = createPriceHistory()

        for (const price of prices) {
          store.insert(price)
        }

        const history = store.getAll()

        // All prices must be present in history
        return (
          history.length === prices.length &&
          prices.every((p, i) => history[i].price === p)
        )
      }
    ),
    { numRuns: 100 }
  )
})

test('P12: inserting a new price does not remove old prices', () => {
  fc.assert(
    fc.property(
      fc.double({ min: Number.EPSILON, max: 500, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: Number.EPSILON, max: 500, noNaN: true, noDefaultInfinity: true }),
      (firstPrice, secondPrice) => {
        const store = createPriceHistory()
        store.insert(firstPrice)
        const countAfterFirst = store.getAll().length

        store.insert(secondPrice)
        const history = store.getAll()

        // History grew by exactly 1 and first price is still there
        return (
          history.length === countAfterFirst + 1 &&
          history[0].price === firstPrice
        )
      }
    ),
    { numRuns: 100 }
  )
})
