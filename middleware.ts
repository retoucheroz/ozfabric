import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes
    if (
        pathname === '/' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.includes('favicon.ico')
    ) {
        return NextResponse.next();
    }

    const isKvMissing = !process.env.KV_REST_API_URL && !process.env.KV_URL;
    if (process.env.NODE_ENV === 'development' && isKvMissing) {
        return NextResponse.next();
    }

    const sessionId = request.cookies.get('ozfabric_session')?.value;
    if (!sessionId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // We use KV directly here because Middleware handles KV well
        const session = await kv.get<{ username: string }>(`session:${sessionId}`);
        if (!session) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        const user = await kv.get<{ role: string, status: string, authorizedPages: string[] }>(`user:${session.username}`);
        if (!user || user.status !== 'active') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Admin can access everything
        if (user.role === 'admin') {
            return NextResponse.next();
        }

        // RBAC Check for specific pages
        // If it's a dashboard subpage, check if user is authorized
        const dashboardPages = [
            '/home',
            '/photoshoot',
            '/editorial',
            '/video',
            '/face-head-swap',
            '/ecom',
            '/analysis',
            '/studio',
            '/train',
            '/history',
            '/settings'
        ];

        const requestedPage = dashboardPages.find(p => pathname.startsWith(p));

        if (requestedPage) {
            const isAuthorized = user.authorizedPages?.includes(requestedPage) || user.authorizedPages?.includes('*');
            if (!isAuthorized) {
                // Redirect to a default authorized page or home
                return NextResponse.redirect(new URL('/home', request.url));
            }
        }

    } catch (e) {
        console.error('Middleware Auth Error:', e);
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
