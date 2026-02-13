import { createClient } from 'redis';
import { User, Session } from './auth-types';
import { cookies } from 'next/headers';
import { hashPassword, comparePasswords } from '@/lib/crypto';

const SESSION_COOKIE_NAME = 'ozfabric_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week

// Configuration
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const isKvConfigured = !!REDIS_URL;
export const isKvActive = isKvConfigured;
const useMemoryFallback = !isKvConfigured && process.env.NODE_ENV === 'development';

// Singleton Redis Client
let redisClient: any = null;

async function getRedis() {
    if (useMemoryFallback) return null;

    if (redisClient?.isOpen) return redisClient;

    try {
        if (!REDIS_URL) {
            console.error('❌ Redis: REDIS_URL is not defined');
            return null;
        }

        console.log('🔌 Redis: Connecting to:', REDIS_URL.split('@')[1] || 'URL');

        redisClient = createClient({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
                connectTimeout: 10000,
                keepAlive: true,
            }
        });

        redisClient.on('error', (err: any) => console.error('❌ Redis Client Error:', err));

        await redisClient.connect();
        console.log('✅ Redis: Connection established');
        return redisClient;
    } catch (e) {
        console.error('❌ Redis Connection Error:', e);
        redisClient = null;
        return null;
    }
}

// Memory Store for Dev
const memoryStore: Map<string, any> = (global as any)._ozMemoryStore || new Map<string, any>();
if (useMemoryFallback) {
    (global as any)._ozMemoryStore = memoryStore;
}

// Helpers
const parseValue = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
        return typeof val === 'string' ? JSON.parse(val) : val;
    } catch (e) {
        return val;
    }
};

export async function getUser(username: string): Promise<User | null> {
    try {
        if (useMemoryFallback) return memoryStore.get(`user:${username}`) || null;
        const client = await getRedis();
        if (!client) return null;

        const data = await client.get(`user:${username}`);
        const user = parseValue(data);

        // SELF-HEALING: If it's admin, ensure they have admin roles
        if (username === 'admin' && user) {
            user.role = 'admin';
            if (!user.authorizedPages) user.authorizedPages = ['*'];
        }

        console.log(`👤 Auth: getUser(${username}) -> ${user ? `Found (Role: ${user.role})` : 'NULL'}`);
        return user;
    } catch (e) {
        console.error('Redis getUser Error:', e);
        return null;
    }
}

export async function saveUser(user: User): Promise<void> {
    try {
        if (useMemoryFallback) {
            memoryStore.set(`user:${user.username}`, user);
            return;
        }
        const client = await getRedis();
        if (client) {
            await client.set(`user:${user.username}`, JSON.stringify(user));
            console.log(`💾 Auth: saveUser(${user.username})`);
        }
    } catch (e) {
        console.error('Redis saveUser Error:', e);
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
            const client = await getRedis();
            if (client) {
                await client.set(`session:${sessionId}`, JSON.stringify(session), {
                    EX: SESSION_TTL
                });
                await client.sAdd('active_sessions', sessionId);
                console.log(`🔑 Auth: createSession(${username}) [${sessionId}]`);
            }
        }
    } catch (e) {
        console.error('Redis createSession Error:', e);
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
            const client = await getRedis();
            if (client) {
                const data = await client.get(`session:${sessionId}`);
                console.log(`🔑 Auth: getSession(${sessionId}) -> ${data ? 'Found' : 'NULL'}`);
                session = parseValue(data);
            }
        }

        if (session) {
            const client = await getRedis();
            if (client) await client.set(`heartbeat:${session.username}`, Date.now().toString(), { EX: 300 });
        }
        return session;
    } catch (e) {
        console.error('Redis getSession Error:', e);
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
                const client = await getRedis();
                if (client) {
                    const data = await client.get(`session:${sessionId}`);
                    const session = parseValue(data);
                    if (session) await client.del(`heartbeat:${session.username}`);
                    await client.del(`session:${sessionId}`);
                    await client.sRem('active_sessions', sessionId);
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
        const client = await getRedis();
        if (!client) return [];
        const heartbeats = await client.keys('heartbeat:*');
        return heartbeats.map((key: string) => key.split(':')[1]);
    } catch (e) {
        return [];
    }
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
        const client = await getRedis();
        if (!client) return [];
        const keys = await client.keys('user:*');
        if (keys.length === 0) return [];
        const values = await client.mGet(keys);

        return values.map(parseValue).filter(Boolean).map((u: User) => {
            const { passwordHash, ...rest } = u;

            // Self-heal admin in list too
            if (rest.username === 'admin') {
                rest.role = 'admin';
            }

            return rest;
        });
    } catch (e) {
        return [];
    }
}
