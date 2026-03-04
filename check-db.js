
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool } = require('@neondatabase/serverless');

const neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neonPool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            name: true,
            role: true,
            credits: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
