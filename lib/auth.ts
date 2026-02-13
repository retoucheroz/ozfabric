import Redis from 'ioredis';
import { User, Session } from './auth-types';
import { cookies } from 'next/headers';
import { hashPassword, comparePasswords } from '@/lib/crypto';

const SESSION_COOKIE_NAME = 'ozfabric_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 1 week

// Check for Redis configuration
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const isKvConfigured = !!REDIS_URL;
export const isKvActive = isKvConfigured;
const useMemoryFallback = !isKvConfigured && process.env.NODE_ENV === 'development';

// Singleton Redis client
let redisClient: Redis | null = null;

function getRedis() {
    if (useMemoryFallback) return null;
    if (redisClient) return redisClient;

    if (REDIS_URL) {
        redisClient = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
        });
        return redisClient;
    }
    return null;
}

// Persist memory store across HMR
const memoryStore: Map<string, any> = (global as any)._ozMemoryStore || new Map<string, any>();
if (useMemoryFallback) {
    (global as any)._ozMemoryStore = memoryStore;
    console.log(`🚀 Auth: Using local memory fallback`);
}

// Helper to parse JSON from Redis
const parseValue = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return val;
    }
};

export async function getUser(username: string): Promise<User | null> {
    try {
        if (useMemoryFallback) return memoryStore.get(`user:${username}`) || null;
        const client = getRedis();
        if (!client) return null;

        const data = await client.get(`user:${username}`);
        return parseValue(data);
    } catch (e) {
        console.error('Redis Get User Error:', e);
        return null;
    }
}

export async function saveUser(user: User): Promise<void> {
    try {
        if (useMemoryFallback) {
            memoryStore.set(`user:${user.username}`, user);
            return;
        }
        const client = getRedis();
        if (client) await client.set(`user:${user.username}`, JSON.stringify(user));
    } catch (e) {
        console.error('Redis Save User Error:', e);
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
            const client = getRedis();
            if (client) {
                await client.set(`session:${sessionId}`, JSON.stringify(session), 'EX', SESSION_TTL);
                await client.sadd('active_sessions', sessionId);
            }
        }
    } catch (e) {
        console.error('Redis Session Error:', e);
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
            const client = getRedis();
            if (client) {
                const data = await client.get(`session:${sessionId}`);
                session = parseValue(data);
            }
        }

        if (session) {
            if (useMemoryFallback) {
                memoryStore.set(`heartbeat:${session.username}`, Date.now());
            } else {
                const client = getRedis();
                if (client) await client.set(`heartbeat:${session.username}`, Date.now(), 'EX', 300);
            }
        }
        return session;
    } catch (e) {
        console.error('Redis GetSession Error:', e);
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
                const client = getRedis();
                if (client) {
                    const data = await client.get(`session:${sessionId}`);
                    const session = parseValue(data);
                    if (session) await client.del(`heartbeat:${session.username}`);
                    await client.del(`session:${sessionId}`);
                    await client.srem('active_sessions', sessionId);
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
        const client = getRedis();
        if (!client) return [];
        const heartbeats = await client.keys('heartbeat:*');
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
            const client = getRedis();
            if (!client) return [];
            const keys = await client.keys('user:*');
            if (keys.length === 0) return [];
            const values = await client.mget(...keys);
            users = values.map(parseValue).filter(Boolean);
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
