// Feature: poultry-farm-tracker
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fc from 'fast-check'
import {
  computeRevenue,
  computeProfit,
  classifyProfitability,
} from '../lib/profitability'

// ---------------------------------------------------------------------------
// Unit tests — specific examples including boundary values
// ---------------------------------------------------------------------------

test('computeRevenue: 100 eggs × 0.50 = 50.00', () => {
  assert.equal(computeRevenue(100, 0.5), 50)
})

test('computeRevenue: 0 eggs = 0 revenue', () => {
  assert.equal(computeRevenue(0, 1.5), 0)
})

test('computeProfit: revenue 200, cost 150 → profit 50', () => {
  assert.equal(computeProfit(200, 150), 50)
})

test('computeProfit: revenue 100, cost 100 → profit 0 (break-even)', () => {
  assert.equal(computeProfit(100, 100), 0)
})

test('computeProfit: revenue 80, cost 100 → profit -20 (loss)', () => {
  assert.equal(computeProfit(80, 100), -20)
})

test('classifyProfitability: positive profit → "profitable"', () => {
  assert.equal(classifyProfitability(0.01), 'profitable')
  assert.equal(classifyProfitability(1000), 'profitable')
})

test('classifyProfitability: zero profit → "break-even"', () => {
  assert.equal(classifyProfitability(0), 'break-even')
})

test('classifyProfitability: negative profit → "loss"', () => {
  assert.equal(classifyProfitability(-0.01), 'loss')
  assert.equal(classifyProfitability(-500), 'loss')
})

// ---------------------------------------------------------------------------
// Property 10: Profitability classification is consistent with profit value
// Validates: Requirements 6.3, 6.4, 6.5
// ---------------------------------------------------------------------------

// Feature: poultry-farm-tracker, Property 10: Profitability classification is consistent with profit value
test('P10: classifyProfitability matches profit sign for any numeric value', () => {
  fc.assert(
    fc.property(
      fc.double({ noNaN: true, noDefaultInfinity: true }),
      (profit) => {
        const status = classifyProfitability(profit)
        if (profit > 0) return status === 'profitable'
        if (profit === 0) return status === 'break-even'
        return status === 'loss'
      }
    ),
    { numRuns: 100 }
  )
})

test('P10: computeRevenue and computeProfit compose correctly with classifyProfitability', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }),
      fc.double({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: 0, max: 50000, noNaN: true, noDefaultInfinity: true }),
      (eggs, pricePerEgg, feedCost) => {
        const revenue = computeRevenue(eggs, pricePerEgg)
        const profit = computeProfit(revenue, feedCost)
        const status = classifyProfitability(profit)

        if (profit > 0) return status === 'profitable'
        if (profit === 0) return status === 'break-even'
        return status === 'loss'
      }
    ),
    { numRuns: 100 }
  )
})
