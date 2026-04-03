import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.resolve(__dirname, '../.env.local') })

import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const db = postgres(connectionString)

async function setupDatabase() {
  try {
    // Create users table
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
    console.log('Created users table')

    // Create feed_batches table
    await db`
      CREATE TABLE IF NOT EXISTS feed_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feed_type TEXT NOT NULL,
        quantity_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_kg > 0),
        total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
        cost_per_kg NUMERIC(10, 4) NOT NULL GENERATED ALWAYS AS (total_cost / quantity_kg) STORED,
        supplier_name TEXT,
        purchase_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
    console.log('Created feed_batches table')

    // Create depletion_events table
    await db`
      CREATE TABLE IF NOT EXISTS depletion_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feed_batch_id UUID NOT NULL REFERENCES feed_batches(id) ON DELETE CASCADE,
        depletion_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
    console.log('Created depletion_events table')

    // Create egg_records table
    await db`
      CREATE TABLE IF NOT EXISTS egg_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collection_date DATE NOT NULL,
        egg_count INTEGER NOT NULL CHECK (egg_count >= 0),
        feed_batch_id UUID REFERENCES feed_batches(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, collection_date)
      );
    `
    console.log('Created egg_records table')

    // Create egg_prices table
    await db`
      CREATE TABLE IF NOT EXISTS egg_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        price NUMERIC(10, 4) NOT NULL CHECK (price > 0),
        effective_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
    console.log('Created egg_prices table')

    // Create indexes
    await db`
      CREATE INDEX IF NOT EXISTS idx_feed_batches_user_purchase ON feed_batches(user_id, purchase_date);
    `
    await db`
      CREATE INDEX IF NOT EXISTS idx_egg_records_user_date ON egg_records(user_id, collection_date);
    `
    console.log('Created indexes')

    console.log('Database setup complete!')
  } catch (err) {
    console.error('Error setting up database:', err)
  } finally {
    await db.end()
  }
}

setupDatabase()
