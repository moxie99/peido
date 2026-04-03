import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(__dirname, '../.env.local') })

import bcrypt from 'bcryptjs'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const db = postgres(connectionString)

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@farm.com'
  const password = process.env.ADMIN_PASSWORD || 'password123'
  
  const passwordHash = await bcrypt.hash(password, 10)
  
  try {
    await db`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}
    `
    console.log(`Admin created/updated: ${email} / ${password}`)
  } catch (err) {
    console.error('Error creating admin:', err)
  } finally {
    await db.end()
  }
}

createAdmin()
