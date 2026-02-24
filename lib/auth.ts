import { User, Session } from './auth-types';
import { cookies } from 'next/headers';
import { hashPassword, comparePasswords } from '@/lib/crypto';
import {
    getUserByEmail,
    createUser,
    updateUser,
    getAllUsers as pgGetAllUsers,
    deleteUserByEmail,
    DbUser,
    createDbSession,
    getDbSession,
    deleteDbSession
} from './postgres';

const SESSION_COOKIE_NAME = 'modeon_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week

export const isKvActive = true;

function dbUserToUser(dbUser: DbUser): User {
    let authPages: string[] = [];
    if (Array.isArray(dbUser.authorized_pages)) {
        authPages = dbUser.authorized_pages;
    } else if (typeof dbUser.authorized_pages === 'string') {
        const str = dbUser.authorized_pages as string;
        authPages = str
            .replace(/^\{|\}$/g, '')
            .split(',')
            .map(s => s.trim().replace(/^"|"$/g, ''))
            .filter(Boolean);
    }

    return {
        username: dbUser.email,
        email: dbUser.email,
        name: dbUser.name || undefined,
        passwordHash: dbUser.password_hash || '',
        role: dbUser.role as 'admin' | 'user',
        credits: dbUser.credits,
        status: (dbUser.status || 'active') as 'active' | 'pending' | 'disabled',
        authorizedPages: authPages,
        customTitle: dbUser.custom_title || undefined,
        customLogo: dbUser.custom_logo || undefined,
        authType: (dbUser.auth_type || 'credentials') as 'credentials' | 'google',
        avatar: dbUser.avatar_url || undefined,
        lastSeenAt: dbUser.last_seen_at ? new Date(dbUser.last_seen_at).getTime() : undefined,
        lastSeenPage: dbUser.last_seen_page || undefined,
    };
}

export async function getUser(username: string): Promise<User | null> {
    try {
        const dbUser = await getUserByEmail(username);
        if (!dbUser) return null;

        const user = dbUserToUser(dbUser);

        if (username === 'admin' || dbUser.role === 'admin') {
            user.role = 'admin';
            if (!user.authorizedPages || user.authorizedPages.length === 0) {
                user.authorizedPages = ['*'];
            }
        }

        console.log(`👤 Auth: getUser(${username}) -> Role: ${user.role}, Pages: ${user.authorizedPages?.length || 0}`);
        return user;
    } catch (e) {
        console.error('Postgres getUser Error:', e);
        return null;
    }
}

export async function saveUser(user: User): Promise<void> {
    try {
        const existingUser = await getUserByEmail(user.username);
        console.log(`💾 Auth: saveUser(${user.username}) -> Existing: ${!!existingUser}, Role: ${user.role}, Pages: ${user.authorizedPages?.length || 0}`);

        if (existingUser) {
            await updateUser(user.username, {
                credits: Math.round(user.credits || 0),
                role: user.role,
                status: user.status,
                authorized_pages: user.authorizedPages,
                custom_title: user.customTitle,
                custom_logo: user.customLogo,
                auth_type: user.authType,
                avatar_url: user.avatar,
            });
        } else {
            await createUser(
                user.username,
                user.name || null,
                user.passwordHash || null,
                user.role || 'user',
                user.authType || 'credentials',
                user.avatar || null,
                user.authorizedPages || []
            );
        }
    } catch (e) {
        console.error('saveUser Error:', e);
        throw e;
    }
}

export async function createSession(username: string): Promise<string> {
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + SESSION_TTL * 1000;

    await createDbSession(sessionId, username, expiresAt);
    console.log(`🔑 Auth: createSession(${username}) [${sessionId}]`);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TTL,
        path: '/',
    });

    return sessionId;
}

export async function getSession(): Promise<Session | null> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionId) return null;

        const dbSession = await getDbSession(sessionId);
        if (!dbSession) {
            console.log(`🔑 Auth: getSession(${sessionId}) -> NULL`);
            return null;
        }

        const session: Session = {
            sessionId: dbSession.session_id,
            username: dbSession.username,
            expiresAt: dbSession.expires_at
        };

        console.log(`🔑 Auth: getSession(${sessionId}) -> Found (${session.username})`);
        return session;
    } catch (e) {
        console.error('getSession Error:', e);
        return null;
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (sessionId) {
            await deleteDbSession(sessionId);
        }
        cookieStore.delete(SESSION_COOKIE_NAME);
    } catch (e) {
        console.error('Logout error:', e);
    }
}

export async function getOnlineUsers(): Promise<string[]> {
    return [];
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const dbUsers = await pgGetAllUsers();
    return dbUsers.map(u => ({
        username: u.email,
        email: u.email,
        name: u.name || undefined,
        role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
        credits: u.credits,
        status: (u.status || 'active') as 'active' | 'pending' | 'disabled',
        authorizedPages: u.authorized_pages || [],
        customTitle: u.custom_title || undefined,
        customLogo: u.custom_logo || undefined,
        authType: (u.auth_type || 'credentials') as 'credentials' | 'google',
        avatar: u.avatar_url || undefined,
        lastSeenAt: u.last_seen_at ? new Date(u.last_seen_at).getTime() : undefined,
        lastSeenPage: u.last_seen_page || undefined,
    }));
}

export async function deleteUser(username: string): Promise<void> {
    try {
        await deleteUserByEmail(username);
        console.log(`🗑️ Auth: deleteUser(${username})`);
    } catch (e) {
        console.error('Postgres deleteUser Error:', e);
    }
}
