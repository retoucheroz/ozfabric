import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateUserActivity } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { page } = await req.json();
        if (!page) return NextResponse.json({ error: 'Page missing' }, { status: 400 });

        await updateUserActivity(session.user.id, page);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Activity Update Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
