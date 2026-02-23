import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser, getAllUsers, saveUser, deleteUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkAdmin(req?: NextRequest) {
    // Fallback: Allow admin operations via ADMIN_PASSWORD header when KV is unavailable
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && req) {
        const providedSecret = req.headers.get('x-admin-secret');
        if (providedSecret === adminPassword) {
            return { username: 'admin', role: 'admin' } as any;
        }
    }

    const session = await getSession();
    if (!session) return null;
    const user = await getUser(session.username);
    if (!user || user.role !== 'admin') return null;
    return user;
}

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const users = await getAllUsers();
        return NextResponse.json(users);
    } catch (e: any) {
        console.error('ADMIN_GET_USERS_ERROR:', e);
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { username, updates } = await req.json();
    const user = await getUser(username);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Handle logo upload if provided as base64
    if (updates.customLogo && updates.customLogo.startsWith('data:image')) {
        const { ensureR2Url } = await import('@/lib/s3');
        updates.customLogo = await ensureR2Url(updates.customLogo, 'branding/logos');
    }

    const updatedUser = { ...user, ...updates };
    await saveUser(updatedUser);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });
    if (username === 'admin') return NextResponse.json({ error: 'Cannot delete admin' }, { status: 400 });

    await deleteUser(username);
    return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let { username, password, role, customTitle, customLogo } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const existing = await getUser(username);
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Handle logo upload if provided as base64
        if (customLogo && customLogo.startsWith('data:image')) {
            const { ensureR2Url } = await import('@/lib/s3');
            customLogo = await ensureR2Url(customLogo, 'branding/logos');
        }

        const { hashPassword } = await import('@/lib/crypto');
        const newUser = {
            username,
            passwordHash: await hashPassword(password),
            role: role || 'user',
            status: 'active',
            authorizedPages: ['/home', '/photoshoot'],
            credits: 0,
            customTitle: customTitle || '',
            customLogo: customLogo || '',
            authType: 'credentials',
            createdAt: Date.now(),
        };

        await saveUser(newUser as any);
        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
