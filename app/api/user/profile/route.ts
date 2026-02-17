import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser, isKvActive } from '@/lib/auth';
import { updateUser } from '@/lib/postgres';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, avatar } = await req.json();

        const updatedUser = await updateUser(session.username, {
            ...(name !== undefined && { name }),
            ...(avatar !== undefined && { avatar_url: avatar })
        });

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (e) {
        console.error('Profile update error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
