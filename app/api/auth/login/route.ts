import { NextRequest, NextResponse } from 'next/server';
import { getUser, createSession, saveUser } from '@/lib/auth';
import { comparePasswords, hashPassword } from '@/lib/crypto';
import { User } from '@/lib/auth-types';

export async function POST(req: NextRequest) {
    console.log('🔐 Login attempt started...');
    try {
        const { username, password } = await req.json();
        const adminPass = process.env.ADMIN_PASSWORD;

        console.log(`👤 User: ${username}, AdminPass configured: ${!!adminPass}`);

        // Check for Admin Override (from Env Var)
        if (username === 'admin' && adminPass && password === adminPass) {
            console.log('⭐ Admin override detected');
            // Ensure admin user exists in KV
            let user = await getUser('admin');
            if (!user) {
                user = {
                    username: 'admin',
                    passwordHash: await hashPassword(password),
                    role: 'admin',
                    status: 'active',
                    authorizedPages: ['*'], // Special wildcard for admin
                    credits: 0,
                    createdAt: Date.now(),
                };
                await saveUser(user);
            }
            await createSession('admin');
            return NextResponse.json({ success: true, role: 'admin' });
        }

        const user = await getUser(username);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
        }

        if (user.status !== 'active') {
            return NextResponse.json({ success: false, error: 'Account is pending approval or disabled' }, { status: 403 });
        }

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
        }

        await createSession(username);
        return NextResponse.json({ success: true, role: user.role });

    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
