import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Google Auth not configured' }, { status: 500 });
    }

    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'select_account',
    });

    return NextResponse.redirect(url);
}
