import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser, saveUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getUser(session.username);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { amount } = await req.json();
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if ((user.credits || 0) < amount) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
        }

        const updatedUser = {
            ...user,
            credits: (user.credits || 0) - amount
        };

        await saveUser(updatedUser);

        return NextResponse.json({
            success: true,
            newBalance: updatedUser.credits
        });

    } catch (e) {
        console.error('Deduct credits error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
