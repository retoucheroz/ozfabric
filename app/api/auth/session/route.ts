import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false });
        }

        const user = await getUser(session.username);
        if (!user) {
            return NextResponse.json({ authenticated: false });
        }

        const { passwordHash, ...safeUser } = user;
        return NextResponse.json({ authenticated: true, user: safeUser });

    } catch (e) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
