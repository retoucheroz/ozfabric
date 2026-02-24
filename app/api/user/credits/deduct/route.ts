import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { deductCredits } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { amount } = await req.json();
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const updatedUser = await deductCredits(session.user.id, amount);

        return NextResponse.json({
            success: true,
            newBalance: updatedUser.credits
        });

    } catch (e: any) {
        if (e.message === 'Insufficient credits') {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
        }
        console.error('Deduct credits error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
