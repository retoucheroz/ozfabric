import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL || "");

async function migrate() {
    console.log("🚀 Starting database migration...");

    try {
        // Add avatar_url column
        console.log("Checking avatar_url...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
        console.log("✅ avatar_url added/checked.");

        // Also check for other recent additions just in case
        console.log("Checking auth_type...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'credentials';`;
        console.log("✅ auth_type added/checked.");

        console.log("Checking custom_title...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_title TEXT;`;
        console.log("✅ custom_title added/checked.");

        console.log("Checking custom_logo...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_logo TEXT;`;
        console.log("✅ custom_logo added/checked.");

        console.log("Ensuring authorized_pages is TEXT[]...");
        // If it exists but might be string, this is tricky, but let's try to add if missing
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS authorized_pages TEXT[];`;
        console.log("✅ authorized_pages added/checked.");

        console.log("Creating credit_transactions table...");
        await sql`
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id SERIAL PRIMARY KEY,
                user_email TEXT NOT NULL,
                amount INTEGER NOT NULL,
                description TEXT,
                type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("✅ credit_transactions table created/checked.");

        console.log("🚀 Migration complete!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
}

migrate();
