import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes - always allow
    if (
        pathname === '/' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.includes('favicon.ico')
    ) {
        return NextResponse.next();
    }

    // Simple cookie check for dashboard routes
    // Detailed validation happens in Server Components / API routes
    const sessionId = request.cookies.get('modeon_session')?.value;

    if (!sessionId) {
        // No session cookie, redirect to login
        const loginUrl = new URL('/', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Allow the request to proceed. 
    // The individual pages and API routes will validate the session against Redis.
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)'],
}
