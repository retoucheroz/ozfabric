import { NextRequest, NextResponse } from 'next/server';
import { getUser, saveUser } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';
import { User } from '@/lib/auth-types';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (username.length < 3 || password.length < 4) {
            return NextResponse.json({ success: false, error: 'Username (min 3) or password (min 4) too short' }, { status: 400 });
        }

        const existingUser = await getUser(username);
        if (existingUser) {
            return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
        }

        const newUser: User = {
            username,
            passwordHash: await hashPassword(password),
            role: 'user',
            status: 'pending', // Users must be approved by admin
            authorizedPages: ['/home', '/photoshoot'], // Default access
            credits: 0,
            createdAt: Date.now(),
        };

        await saveUser(newUser);
        return NextResponse.json({ success: true, message: 'Registration successful. Awaiting admin approval.' });

    } catch (e) {
        console.error('Registration error:', e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
