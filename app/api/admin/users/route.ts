import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') return null;
    return session.user;
}

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                role: true,
                credits: true,
                status: true,
                authorizedPages: true,
                customTitle: true,
                customLogo: true,
                authType: true,
                lastSeenAt: true,
                lastSeenPage: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map to legacy format for AdminPanel compatibility
        const mapped = users.map((u: any) => ({
            username: u.email || u.name,
            email: u.email,
            name: u.name,
            image: u.image,
            role: u.role,
            credits: u.credits,
            status: u.status,
            authorizedPages: u.authorizedPages,
            customTitle: u.customTitle,
            customLogo: u.customLogo,
            authType: u.authType,
            lastSeenAt: u.lastSeenAt?.getTime(),
            lastSeenPage: u.lastSeenPage,
            avatar: u.image,
        }));

        return NextResponse.json(mapped);
    } catch (e: any) {
        console.error('ADMIN_GET_USERS_ERROR:', e);
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { username, updates } = await req.json();

    // Find user by email or name (legacy compatibility)
    const user = await prisma.user.findFirst({
        where: { OR: [{ email: username }, { name: username }] },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Handle logo upload if provided as base64
    let customLogo = updates.customLogo;
    if (customLogo && customLogo.startsWith('data:image')) {
        const { ensureR2Url } = await import('@/lib/s3');
        customLogo = await ensureR2Url(customLogo, 'branding/logos');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            ...(updates.role !== undefined && { role: updates.role }),
            ...(updates.status !== undefined && { status: updates.status }),
            ...(updates.authorizedPages !== undefined && { authorizedPages: updates.authorizedPages }),
            ...(updates.customTitle !== undefined && { customTitle: updates.customTitle }),
            ...(customLogo !== undefined && { customLogo }),
            ...(updates.credits !== undefined && { credits: updates.credits }),
        },
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

    const user = await prisma.user.findFirst({
        where: { OR: [{ email: username }, { name: username }] },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role === 'admin') return NextResponse.json({ error: 'Cannot delete admin' }, { status: 400 });

    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let { username, password, role, customTitle, customLogo } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ email: username }, { name: username }] },
        });
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Handle logo upload if provided as base64
        if (customLogo && customLogo.startsWith('data:image')) {
            const { ensureR2Url } = await import('@/lib/s3');
            customLogo = await ensureR2Url(customLogo, 'branding/logos');
        }

        await prisma.user.create({
            data: {
                email: username,
                name: username,
                passwordHash: await bcrypt.hash(password, 12),
                role: role || 'user',
                status: 'active',
                authorizedPages: ['/home', '/photoshoot'],
                credits: 0,
                customTitle: customTitle || null,
                customLogo: customLogo || null,
                authType: 'credentials',
            },
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('Admin create user error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
