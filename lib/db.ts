import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

// Singleton pattern: reuse the connection in development (hot reload safe)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof postgres> | undefined }

export const db = globalForDb.db ?? postgres(connectionString)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db
}
