
import { prisma } from './lib/prisma';

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
