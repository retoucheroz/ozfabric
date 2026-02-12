import { NextResponse } from 'next/server';
import { getOnlineUsers, getSession, getUser } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await getUser(session.username);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const onlineUsers = await getOnlineUsers();
    return NextResponse.json({ onlineCount: onlineUsers.length, users: onlineUsers });
}
