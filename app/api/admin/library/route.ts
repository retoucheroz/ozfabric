import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getGlobalLibraryItems, addGlobalLibraryItem, updateGlobalLibraryItem, deleteGlobalLibraryItem } from '@/lib/library-service';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') return null;
    return session.user;
}

export async function GET(req: NextRequest) {
    const category = req.nextUrl.searchParams.get('category');
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';
    const items = await getGlobalLibraryItems(category || undefined, !isAdmin);
    return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { category, data, isPublic } = await req.json();
    const item = await addGlobalLibraryItem(category, data, isPublic);
    return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, data, isPublic } = await req.json();
    const item = await updateGlobalLibraryItem(id, data, isPublic);
    return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await req.json();
    await deleteGlobalLibraryItem(id);
    return NextResponse.json({ success: true });
}
