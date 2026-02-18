import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser } from '@/lib/auth';
import { getCreditTransactions, addCredits, logCreditTransaction, getUserByEmail } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
    const session = await getSession();
    if (!session) return null;
    const user = await getUser(session.username);
    if (!user || user.role !== 'admin') return null;
    return user;
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
        const history = await getCreditTransactions(email);
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

        // Use addCredits for both positive and negative if we want to log it
        // Actually addCredits adds, and we can pass negative to subtract? 
        // Let's check postgres.ts addCredits: SET credits = credits + ${amount}
        // Yes, it works for negative too.

        const updatedUser = await addCredits(email, amount, description || (amount > 0 ? 'Admin Deposit' : 'Admin Correction'));

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, credits: updatedUser.credits });
    } catch (e) {
        console.error('Credit update error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
