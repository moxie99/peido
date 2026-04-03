import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface SessionPayload {
  userId: string
  expiresAt: Date
}

const SESSION_COOKIE = 'session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET env var must be set and at least 16 characters long')
  }
  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey())
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    return {
      userId: payload.userId as string,
      expiresAt: new Date(payload.expiresAt as string),
    }
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return decrypt(token)
}
