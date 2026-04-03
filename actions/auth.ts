'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'
import type { FormState } from '@/lib/types'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { message: 'Invalid email or password.' }
  }

  const { email, password } = parsed.data

  // Look up user by email
  const rows = await db`
    SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1
  `

  const user = rows[0] as { id: string; password_hash: string } | undefined

  if (!user) {
    return { message: 'Invalid email or password.' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatch) {
    return { message: 'Invalid email or password.' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout(): Promise<never> {
  await deleteSession()
  redirect('/login')
}
