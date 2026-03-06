import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Güvenlik Listesi (Primary Admins)
const checkIsPrimaryAdmin = (email?: string | null, name?: string | null) => {
    const e = email?.toLowerCase().trim();
    const n = name?.toLowerCase().trim();
    const primaryAdmins = ['admin', 'kilicozzgur@gmail.com', 'retoucheroz', 'retoucheroz@gmail.com', 'ozfabric'];
    return primaryAdmins.includes(e || '') || primaryAdmins.includes(n || '');
};

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // Hem session rolü hem de email/name bazlı kontrol
    const isPrimary = checkIsPrimaryAdmin(session.user.email, session.user.name);
    if (!isPrimary && session.user.role !== 'admin') return null;

    return session.user;
}

export async function GET() {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true,
                credits: true, status: true, lastSeenAt: true,
                lastSeenPage: true, createdAt: true, authorizedPages: true,
                customTitle: true, customLogo: true, image: true, authType: true
            }
        });

        // Admin rolünü liste için de manuel enjekte et (Tutarlılık için)
        const mapped = users.map((u: any) => ({
            username: u.name || u.email || 'unknown',
            name: u.name,
            email: u.email,
            role: checkIsPrimaryAdmin(u.email, u.name) ? 'admin' : u.role,
            credits: u.credits,
            status: u.status,
            lastSeenAt: u.lastSeenAt?.getTime(),
            lastSeenPage: u.lastSeenPage,
            createdAt: u.createdAt?.getTime(),
            authorizedPages: u.authorizedPages,
            customTitle: u.customTitle,
            customLogo: u.customLogo,
            avatar: u.image,
            authType: u.authType
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        let { username, password, customTitle } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ name: username }, { email: username }] }
        });
        if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 400 });

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: {
                name: username,
                email: username.includes('@') ? username.toLowerCase() : null,
                passwordHash,
                role: 'user', // Yeni açılan herkes user olur
                status: 'active',
                credits: 0,
                authorizedPages: ['/home'],
                customTitle: customTitle || null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { username, updates } = await req.json();

        // Rol değişikliğini API üzerinden engelle
        if (updates.role) delete updates.role;

        await prisma.user.update({
            where: { name: username },
            data: updates
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { username } = await req.json();
        // Admin kullanıcısı silinemez
        if (username === 'admin') return NextResponse.json({ error: 'Cannot delete system admin' }, { status: 400 });

        await prisma.user.delete({ where: { name: username } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
