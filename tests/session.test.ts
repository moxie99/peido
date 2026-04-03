// Feature: poultry-farm-tracker
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encrypt, decrypt } from '../lib/session'

// Set SESSION_SECRET before any imports that use it
process.env.SESSION_SECRET = 'test-secret-key-that-is-32-chars!!'

test('encrypt then decrypt returns the same payload (round-trip)', async () => {
  const payload = {
    userId: 'user-abc-123',
    expiresAt: new Date('2099-01-01T00:00:00.000Z'),
  }

  const token = await encrypt(payload)
  assert.ok(typeof token === 'string', 'encrypt should return a string token')

  const result = await decrypt(token)
  assert.ok(result !== null, 'decrypt should return a payload, not null')
  assert.equal(result.userId, payload.userId, 'userId should round-trip correctly')
  assert.equal(
    result.expiresAt.toISOString(),
    payload.expiresAt.toISOString(),
    'expiresAt should round-trip correctly'
  )
})

test('decrypt returns null for an invalid token', async () => {
  const result = await decrypt('not.a.valid.token')
  assert.equal(result, null, 'invalid token should return null')
})
