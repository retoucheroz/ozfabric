import { kv } from '@vercel/kv';
import { User, Session } from './auth-types';
import { cookies } from 'next/headers';
import { hashPassword, comparePasswords } from '@/lib/crypto';

const SESSION_COOKIE_NAME = 'ozfabric_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week

// Local memory fallback for development when KV is not configured
const isKvConfigured = !!(process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL);
export const isKvActive = isKvConfigured;
const useMemoryFallback = !isKvConfigured && process.env.NODE_ENV === 'development';

// Persist memory store across HMR (Hot Module Replacement) in development
const memoryStore: Map<string, any> = (global as any)._ozMemoryStore || new Map<string, any>();
if (useMemoryFallback) {
    (global as any)._ozMemoryStore = memoryStore;
    console.log(`🚀 Auth: Using local memory fallback (Sessions: ${Array.from(memoryStore.keys()).filter(k => k.startsWith('session:')).length})`);
}

async function getKv() {
    if (useMemoryFallback) return null;
    return kv;
}

export async function getUser(username: string): Promise<User | null> {
    try {
        if (useMemoryFallback) return memoryStore.get(`user:${username}`) || null;
        const _kv = await getKv();
        return _kv ? await _kv.get<User>(`user:${username}`) : null;
    } catch (e) {
        console.error('KV Get Error:', e);
        return null;
    }
}

export async function saveUser(user: User): Promise<void> {
    try {
        if (useMemoryFallback) {
            memoryStore.set(`user:${user.username}`, user);
            return;
        }
        const _kv = await getKv();
        if (_kv) await _kv.set(`user:${user.username}`, user);
    } catch (e) {
        console.error('KV Save Error:', e);
    }
}

export async function createSession(username: string): Promise<string> {
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + SESSION_TTL * 1000;
    const session: Session = { sessionId, username, expiresAt };

    try {
        if (useMemoryFallback) {
            memoryStore.set(`session:${sessionId}`, session);
            const active = memoryStore.get('active_sessions') || [];
            if (!active.includes(sessionId)) {
                memoryStore.set(`active_sessions`, [...active, sessionId]);
            }
        } else {
            const _kv = await getKv();
            if (_kv) {
                await _kv.set(`session:${sessionId}`, session, { ex: SESSION_TTL });
                await _kv.sadd('active_sessions', sessionId);
            }
        }
    } catch (e) {
        console.error('KV Session Error:', e);
    }

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

        let session: Session | null = null;
        if (useMemoryFallback) {
            session = memoryStore.get(`session:${sessionId}`) || null;
        } else {
            const _kv = await getKv();
            session = _kv ? await _kv.get<Session>(`session:${sessionId}`) : null;
        }

        if (session) {
            if (useMemoryFallback) {
                memoryStore.set(`heartbeat:${session.username}`, Date.now());
            } else {
                const _kv = await getKv();
                if (_kv) await _kv.set(`heartbeat:${session.username}`, Date.now(), { ex: 300 });
            }
        }
        return session;
    } catch (e) {
        console.error('KV GetSession Error:', e);
        return null;
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (sessionId) {
            if (useMemoryFallback) {
                const session = memoryStore.get(`session:${sessionId}`);
                if (session) memoryStore.delete(`heartbeat:${session.username}`);
                memoryStore.delete(`session:${sessionId}`);
                const active = (memoryStore.get('active_sessions') || []).filter((id: string) => id !== sessionId);
                memoryStore.set('active_sessions', active);
            } else {
                const _kv = await getKv();
                if (_kv) {
                    const session = await _kv.get<Session>(`session:${sessionId}`);
                    if (session) await _kv.del(`heartbeat:${session.username}`);
                    await _kv.del(`session:${sessionId}`);
                    await _kv.srem('active_sessions', sessionId);
                }
            }
        }
        cookieStore.delete(SESSION_COOKIE_NAME);
    } catch (e) {
        console.error('Logout error:', e);
    }
}

export async function getOnlineUsers(): Promise<string[]> {
    try {
        if (useMemoryFallback) {
            const now = Date.now();
            return Array.from(memoryStore.entries())
                .filter(([key, time]) => key.startsWith('heartbeat:') && (now - time) < 300000)
                .map(([key]) => key.split(':')[1]);
        }
        const _kv = await getKv();
        if (!_kv) return [];
        const heartbeats = await _kv.keys('heartbeat:*');
        return heartbeats.map(key => key.split(':')[1]);
    } catch (e) {
        console.error('Online users error:', e);
        return [];
    }
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
        let users: User[] = [];
        if (useMemoryFallback) {
            users = Array.from(memoryStore.values()).filter(v => v.username && v.passwordHash);
        } else {
            const _kv = await getKv();
            if (!_kv) return [];
            const keys = await _kv.keys('user:*');
            if (keys.length === 0) return [];
            users = await _kv.mget<User[]>(...keys);
        }
        return users.map(u => {
            const { passwordHash, ...rest } = u;
            return rest;
        });
    } catch (e) {
        console.error('All users error:', e);
        return [];
    }
}
