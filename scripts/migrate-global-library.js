// Migration: Ensure global_library table exists with correct JSONB schema
const { neon } = require('@neondatabase/serverless');
const path = require('path');

// Try loading .env.local first, fallback to .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is missing');
        process.exit(1);
    }

    const sql = neon(databaseUrl);
    console.log('✅ Connected to database');

    try {
        // Create the table if it does not exist
        await sql`
            CREATE TABLE IF NOT EXISTS global_library (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `;
        console.log('✅ global_library table ready');

        // Check structure
        const rows = await sql`SELECT COUNT(*) as count FROM global_library`;
        console.log(`📦 Current rows in global_library: ${rows[0].count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error?.message || error);
        process.exit(1);
    }

    console.log('🎉 Migration complete!');
}

migrate();
