import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser, isKvActive } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false, isKvActive });
        }

        const user = await getUser(session.username);
        if (!user) {
            return NextResponse.json({ authenticated: false, isKvActive });
        }

        const { passwordHash, ...safeUser } = user;
        return NextResponse.json({ authenticated: true, user: safeUser, isKvActive });

    } catch (e) {
        return NextResponse.json({ authenticated: false, isKvActive: false }, { status: 500 });
    }
}
