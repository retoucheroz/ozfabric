import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') return null;
    return session.user;
}

// Prisma-based get/set for app_settings
async function getGlobalSetting(key: string): Promise<string | null> {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return setting?.value || null;
}

async function setGlobalSetting(key: string, value: string): Promise<void> {
    await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}

export async function GET(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const apiProvider = await getGlobalSetting('nano_banana_provider') || 'fal_ai';
    return NextResponse.json({ nano_banana_provider: apiProvider });
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { nano_banana_provider } = await req.json();

        if (nano_banana_provider && ['fal_ai', 'kie_ai'].includes(nano_banana_provider)) {
            await setGlobalSetting('nano_banana_provider', nano_banana_provider);
            return NextResponse.json({ success: true, nano_banana_provider });
        }

        return NextResponse.json({ error: 'Invalid provider configuration' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Error' }, { status: 500 });
    }
}
