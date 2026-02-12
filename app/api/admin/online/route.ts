import { NextRequest, NextResponse } from 'next/server';
import { getOnlineUsers, getSession, getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // Fallback: Allow admin operations via ADMIN_SECRET header when KV is unavailable
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
        const providedSecret = req.headers.get('x-admin-secret');
        if (providedSecret === adminSecret) {
            const onlineUsers = await getOnlineUsers();
            return NextResponse.json({ onlineCount: onlineUsers.length, users: onlineUsers });
        }
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await getUser(session.username);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const onlineUsers = await getOnlineUsers();
    return NextResponse.json({ onlineCount: onlineUsers.length, users: onlineUsers });
}
