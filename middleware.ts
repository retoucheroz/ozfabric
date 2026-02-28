import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes - always allow
    if (
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname === '/verify' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/webhooks') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/cookie-policy') ||
        pathname.includes('favicon.ico')
    ) {
        return NextResponse.next();
    }

    // Check NextAuth JWT token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
    });

    if (!token) {
        // No valid session, redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)'],
}
