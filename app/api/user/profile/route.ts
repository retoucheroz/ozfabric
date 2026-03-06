import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                email: true,
                image: true,
                allowOwnApiKeys: true,
                geminiApiKey: true,
                falApiKey: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json(user);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, avatar, geminiApiKey, falApiKey } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(avatar !== undefined && { image: avatar }),
                ...(geminiApiKey !== undefined && { geminiApiKey }),
                ...(falApiKey !== undefined && { falApiKey }),
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (e) {
        console.error('Profile update error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
