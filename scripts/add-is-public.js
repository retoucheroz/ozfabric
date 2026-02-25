const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is missing in .env.local');
        process.exit(1);
    }

    const sql = neon(databaseUrl);
    console.log('Connecting to database...');

    try {
        await sql`ALTER TABLE global_library ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true`;
        console.log('Successfully added is_public column to global_library table');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
