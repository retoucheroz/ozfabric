import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUserActivity } from '@/lib/postgres';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { page } = await req.json();
        if (!page) return NextResponse.json({ error: 'Page missing' }, { status: 400 });

        await updateUserActivity(session.username, page);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Activity Update Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
