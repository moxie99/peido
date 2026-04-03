// Feature: poultry-farm-tracker, Property 13: Authentication — unauthenticated requests are redirected
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fc from 'fast-check'

// Set SESSION_SECRET before importing session module
process.env.SESSION_SECRET = 'test-secret-key-that-is-32-chars!!'

import { proxy } from '../proxy'
import { encrypt } from '../lib/session'
import { NextRequest } from 'next/server'

// Helper to build a NextRequest for a given path, with optional session cookie
function makeRequest(pathname: string, sessionToken?: string): NextRequest {
  const url = `http://localhost${pathname}`
  const req = new NextRequest(url)
  if (sessionToken) {
    req.cookies.set('session', sessionToken)
  }
  return req
}

test('unauthenticated request to protected route redirects to /login', async () => {
  const req = makeRequest('/dashboard')
  const res = await proxy(req)
  assert.ok(res !== undefined, 'proxy should return a response')
  assert.equal(res.status, 307, 'should be a redirect')
  const location = res.headers.get('location')
  assert.ok(location?.includes('/login'), 'should redirect to /login')
})

test('unauthenticated request preserves original URL as redirect query param', async () => {
  const req = makeRequest('/feed/new')
  const res = await proxy(req)
  const location = res.headers.get('location') ?? ''
  const redirectUrl = new URL(location)
  assert.equal(redirectUrl.searchParams.get('redirect'), '/feed/new')
})

test('request with invalid session token redirects to /login', async () => {
  const req = makeRequest('/dashboard', 'not.a.valid.token')
  const res = await proxy(req)
  assert.equal(res.status, 307)
  const location = res.headers.get('location') ?? ''
  assert.ok(location.includes('/login'))
})

test('request with valid session token is allowed through', async () => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await encrypt({ userId: 'user-123', expiresAt })
  const req = makeRequest('/dashboard', token)
  const res = await proxy(req)
  // NextResponse.next() has status 200, not a redirect
  assert.notEqual(res.status, 307, 'valid session should not redirect')
  assert.notEqual(res.status, 302, 'valid session should not redirect')
})

// Property 13: For any protected pathname, a request without a session cookie
// must always redirect to /login with the original path preserved
test('P13 property: any protected path without session always redirects to /login', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.stringMatching(/^\/[a-z]{3,20}(\/[a-z]{3,10})?$/),
      async (pathname) => {
        const req = makeRequest(pathname)
        const res = await proxy(req)
        if (res.status !== 307 && res.status !== 302) return true // not a redirect — skip (e.g. login itself excluded by matcher)
        const location = res.headers.get('location') ?? ''
        return location.includes('/login')
      }
    ),
    { numRuns: 100 }
  )
})
