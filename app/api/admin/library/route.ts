import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUser } from '@/lib/auth';
import { getGlobalLibraryItems, addGlobalLibraryItem, updateGlobalLibraryItem, deleteGlobalLibraryItem } from '@/lib/library-service';

async function checkAdmin() {
    const session = await getSession();
    if (!session) return null;
    const user = await getUser(session.username);
    if (!user || user.role !== 'admin') return null;
    return user;
}

export async function GET(req: NextRequest) {
    const category = req.nextUrl.searchParams.get('category');
    const items = await getGlobalLibraryItems(category || undefined);
    return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { category, data } = await req.json();
    const item = await addGlobalLibraryItem(category, data);
    return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, data } = await req.json();
    const item = await updateGlobalLibraryItem(id, data);
    return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await req.json();
    await deleteGlobalLibraryItem(id);
    return NextResponse.json({ success: true });
}
