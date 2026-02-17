import { User, Session } from './auth-types';
import { cookies } from 'next/headers';
import { hashPassword, comparePasswords } from '@/lib/crypto';
import { 
    getUserByEmail, 
    createUser, 
    updateUserCredits, 
    getAllUsers as pgGetAllUsers, 
    deleteUserByEmail, 
    DbUser,
    createDbSession,
    getDbSession,
    deleteDbSession
} from './postgres';

const SESSION_COOKIE_NAME = 'ozfabric_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week

export const isKvActive = true; // Keep for compatibility

// Convert DbUser to User format
function dbUserToUser(dbUser: DbUser): User {
    return {
        username: dbUser.email,
        email: dbUser.email,
        name: dbUser.name || undefined,
        passwordHash: dbUser.password_hash || '',
        role: dbUser.role as 'admin' | 'user',
        credits: dbUser.credits,
        authorizedPages: dbUser.role === "admin" ? ["*"] : undefined,
        status: (dbUser.status || "active") as "active" | "pending" | "disabled",
    };
}

export async function getUser(username: string): Promise<User | null> {
    try {
        const dbUser = await getUserByEmail(username);
        if (!dbUser) return null;
        
        const user = dbUserToUser(dbUser);
        
        if (username === 'admin' || dbUser.role === 'admin') {
            user.role = 'admin';
            user.authorizedPages = ['*'];
        }
        
        console.log(`👤 Auth: getUser(${username}) -> Found (Role: ${user.role}, Credits: ${user.credits})`);
        return user;
    } catch (e) {
        console.error('Postgres getUser Error:', e);
        return null;
    }
}

export async function saveUser(user: User): Promise<void> {
    try {
        const existingUser = await getUserByEmail(user.username);
        
        if (existingUser) {
            await updateUserCredits(user.username, user.credits || 0);
        } else {
            await createUser(
                user.username,
                user.name || null,
                user.passwordHash || null,
                user.role || 'user'
            );
        }
        console.log(`💾 Auth: saveUser(${user.username})`);
    } catch (e) {
        console.error('Postgres saveUser Error:', e);
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
            console.log(`🔑 Auth: getSession(${sessionId}) -> NULL (not found or expired)`);
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
    // For now, return empty - can implement with heartbeat table later
    return [];
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
        const dbUsers = await pgGetAllUsers();
        return dbUsers.map(u => ({
            username: u.email,
            email: u.email,
            name: u.name || undefined,
            role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
            credits: u.credits,
            authorizedPages: u.role === 'admin' ? ['*'] : undefined,
        }));
    } catch (e) {
        console.error('getAllUsers Error:', e);
        return [];
    }
}

export async function deleteUser(username: string): Promise<void> {
    try {
        await deleteUserByEmail(username);
        console.log(`🗑️ Auth: deleteUser(${username})`);
    } catch (e) {
        console.error('Postgres deleteUser Error:', e);
    }
}
