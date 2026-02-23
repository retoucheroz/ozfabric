import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser } from '@/lib/auth';
import { getGlobalSetting, setGlobalSetting } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

async function checkAdmin(req?: NextRequest) {
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
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const apiProvider = await getGlobalSetting('nano_banana_provider') || 'fal_ai';
    return NextResponse.json({ nano_banana_provider: apiProvider });
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin(req)) {
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
