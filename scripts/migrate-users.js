// One-time script to migrate existing users to the new schema
// Run with: node scripts/migrate-users.js
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log('🚀 Starting user migration...\n');

    // Helper to hash password with bcrypt
    async function hashPassword(plain) {
        return bcrypt.hash(plain, 12);
    }

    // Admin
    const adminId = 'cluser_admin_001';
    await sql`
    INSERT INTO users (id, email, name, role, credits, status, authorized_pages, auth_type, password_hash, created_at, updated_at)
    VALUES (
      ${adminId},
      'admin',
      'Admin',
      'admin',
      88985596,
      'active',
      ${'{"*"}'},
      'credentials',
      ${await hashPassword('Ko224781--??')},
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING
  `;
    console.log('✅ Admin migrated (email: admin, credits: 88,985,596)');

    // Ekrem Güdük
    const ekremId = 'cluser_ekrem_002';
    await sql`
    INSERT INTO users (id, email, name, role, credits, status, authorized_pages, auth_type, custom_title, password_hash, created_at, updated_at)
    VALUES (
      ${ekremId},
      'ekremguduk',
      'Ekrem Güdük',
      'user',
      2131,
      'active',
      ${'{"/home","/photoshoot","photoshoot:batch","/photoshoot/ghost","/analysis","/face-head-swap","/video","/editorial"}'},
      'credentials',
      'Crework',
      ${await hashPassword('ekrem123')},
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING
  `;
    console.log('✅ Ekrem Güdük migrated (email: ekremguduk, credits: 2,131)');

    // kaanerkus
    const kaanId = 'cluser_kaan_003';
    await sql`
    INSERT INTO users (id, email, name, role, credits, status, authorized_pages, auth_type, password_hash, created_at, updated_at)
    VALUES (
      ${kaanId},
      'kaanerkus',
      'kaanerkus',
      'user',
      100,
      'active',
      ${'{"/home","/photoshoot","photoshoot:batch","/editorial","/video","/face-head-swap","/analysis","/photoshoot/ghost"}'},
      'credentials',
      ${await hashPassword('kaan123')},
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING
  `;
    console.log('✅ kaanerkus migrated (email: kaanerkus, credits: 100)');

    // Bayram — Google auth
    const bayramId = 'cluser_bayram_004';
    await sql`
    INSERT INTO users (id, email, name, role, credits, status, authorized_pages, auth_type, image, created_at, updated_at)
    VALUES (
      ${bayramId},
      'byrm.050@gmail.com',
      'Bayram Bıyıklı',
      'user',
      0,
      'active',
      ${'{"/home","/photoshoot","photoshoot:batch","/editorial","/video","/face-head-swap","/analysis","/studio","/train","/photoshoot/ghost"}'},
      'google',
      'https://lh3.googleusercontent.com/a/ACg8ocLRTbBLhqfE6hAlN9molGJsWbiMTXAC2O8w4kJQINfC3gjGQvo-=s96-c',
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING
  `;
    console.log('✅ Bayram Bıyıklı migrated (email: byrm.050@gmail.com, Google auth)');

    console.log('\n🎉 Migration complete!');

    // Verify
    const users = await sql`SELECT id, email, name, role, credits, auth_type FROM users ORDER BY created_at`;
    console.log('\n📋 Users in database:');
    users.forEach(u => {
        console.log(`  - ${u.name || u.email} | ${u.email} | ${u.role} | ${u.credits} credits | ${u.auth_type}`);
    });
}

main().catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
