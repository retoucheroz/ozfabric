// One-time script to create all tables via HTTP connection (bypasses Prisma CLI TCP issues)
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log('🔄 Dropping existing tables...');

    await sql`DROP TABLE IF EXISTS credit_transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS lemon_transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS app_settings CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
    await sql`DROP TABLE IF EXISTS global_library CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    console.log('✅ Old tables dropped');

    console.log('🔄 Creating new tables...');

    // Users table
    await sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      email TEXT UNIQUE,
      "emailVerified" TIMESTAMPTZ,
      image TEXT,
      credits INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      authorized_pages TEXT[] DEFAULT '{}',
      custom_title TEXT,
      custom_logo TEXT,
      auth_type TEXT NOT NULL DEFAULT 'credentials',
      last_seen_at TIMESTAMPTZ,
      last_seen_page TEXT,
      lemon_customer_id TEXT UNIQUE,
      subscription_id TEXT,
      subscription_plan TEXT,
      subscription_status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
    console.log('  ✅ users');

    // Accounts table (NextAuth)
    await sql`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, provider_account_id)
    )
  `;
    console.log('  ✅ accounts');

    // Sessions table (NextAuth)
    await sql`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      session_token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )
  `;
    console.log('  ✅ sessions');

    // Verification tokens (NextAuth)
    await sql`
    CREATE TABLE verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMPTZ NOT NULL,
      UNIQUE(identifier, token)
    )
  `;
    console.log('  ✅ verification_tokens');

    // Credit transactions
    await sql`
    CREATE TABLE credit_transactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'adjustment',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
    console.log('  ✅ credit_transactions');

    // Lemon Squeezy transactions
    await sql`
    CREATE TABLE lemon_transactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      event_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      credits_added INTEGER NOT NULL,
      amount_paid INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      raw_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
    console.log('  ✅ lemon_transactions');

    // App settings
    await sql`
    CREATE TABLE app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
    console.log('  ✅ app_settings');

    console.log('🎉 All tables created successfully!');

    // Verify
    const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
    console.log('\n📋 Current tables:', tables.map(t => t.table_name).join(', '));
}

main().catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
