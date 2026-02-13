import { NextResponse } from 'next/server';
import { getSession, getUser, isKvActive } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            console.log('🏁 Session API: No session found');
            return NextResponse.json({ authenticated: false, isKvActive });
        }

        const user = await getUser(session.username);

        if (!user) {
            console.log(`🏁 Session API: User [${session.username}] not found in Redis`);
            return NextResponse.json({ authenticated: false, isKvActive });
        }

        const { passwordHash, ...safeUser } = user;
        console.log(`🏁 Session API: Success for [${session.username}] as [${user.role}]`);

        return NextResponse.json({
            authenticated: true,
            user: safeUser,
            isKvActive
        });

    } catch (e) {
        console.error('🏁 Session API: Final Catch Error:', e);
        return NextResponse.json({ authenticated: false, isKvActive: false }, { status: 500 });
    }
}
