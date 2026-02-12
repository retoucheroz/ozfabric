import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser, getAllUsers, saveUser } from '@/lib/auth';

async function checkAdmin() {
    const session = await getSession();
    if (!session) return null;
    const user = await getUser(session.username);
    if (!user || user.role !== 'admin') return null;
    return user;
}

export async function GET() {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const users = await getAllUsers();
    return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { username, updates } = await req.json();
    const user = await getUser(username);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updatedUser = { ...user, ...updates };
    await saveUser(updatedUser);
    return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { username, password, role } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const existing = await getUser(username);
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        const { hashPassword } = await import('@/lib/crypto');
        const newUser = {
            username,
            passwordHash: await hashPassword(password),
            role: role || 'user',
            status: 'active',
            authorizedPages: ['/home'],
            createdAt: Date.now(),
        };

        await saveUser(newUser as any);
        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
