import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getUser, saveUser, createSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Auto-detect host for redirect URI
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!code) {
        return NextResponse.redirect(new URL('/?error=no_code', req.url));
    }

    try {
        const client = new OAuth2Client(clientId, clientSecret, redirectUri);
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        if (!googleUser.email) {
            return NextResponse.redirect(new URL('/?error=no_email', req.url));
        }

        // Find or create user
        let user = await getUser(googleUser.email);

        if (!user) {
            // Create new Google user with ALL pages enabled
            user = {
                username: googleUser.email,
                email: googleUser.email,
                name: googleUser.name,
                passwordHash: '',
                role: 'user',
                status: 'active',
                authorizedPages: [
                    '/home',
                    '/photoshoot',
                    'photoshoot:batch',
                    '/editorial',
                    '/video',
                    '/face-head-swap',
                    '/analysis',
                    '/studio',
                    '/train',
                    '/photoshoot/ghost'
                ],
                credits: 1000,
                authType: 'google',
                avatar: googleUser.picture, // Google avatar
                createdAt: Date.now(),
            };
            await saveUser(user);
        } else {
            // Update existing user with Google data if it's a google login
            const updates: any = {};
            if (!user.avatar && googleUser.picture) {
                updates.avatar_url = googleUser.picture;
            }
            if (user.authType !== 'google') {
                updates.auth_type = 'google';
            }
            if (Object.keys(updates).length > 0) {
                const { updateUser } = await import('@/lib/postgres');
                await updateUser(user.username, updates);
            }
        }

        // Create session
        await createSession(user.username);

        // Redirect to home
        return NextResponse.redirect(new URL('/home', req.url));

    } catch (e) {
        console.error('Google Auth Error:', e);
        return NextResponse.redirect(new URL('/?error=auth_failed', req.url));
    }
}
