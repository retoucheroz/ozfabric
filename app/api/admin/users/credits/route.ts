import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { addCredits, deductCredits } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') return null;
    return session.user;
}

export async function GET(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    try {
        // Find user by email or name
        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { name: email }] },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const history = await prisma.creditTransaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(history);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { email, amount, description, type } = await req.json();

        if (!email || amount === undefined) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Find user by email or name
        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { name: email }] },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let updatedUser;
        if (amount > 0) {
            updatedUser = await addCredits(user.id, amount, description || 'Admin Deposit', type || 'adjustment');
        } else if (amount < 0) {
            updatedUser = await deductCredits(user.id, Math.abs(amount), description || 'Admin Correction');
        } else {
            return NextResponse.json({ success: true, credits: user.credits });
        }

        return NextResponse.json({ success: true, credits: updatedUser.credits });
    } catch (e) {
        console.error('Credit update error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
