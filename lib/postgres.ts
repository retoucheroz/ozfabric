import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface DbUser {
    id: number;
    email: string;
    name: string | null;
    credits: number;
    role: string;
    password_hash: string | null;
    created_at: Date;
    updated_at: Date;
    status: string;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0] as DbUser || null;
}

export async function createUser(email: string, name: string | null, passwordHash: string | null, role: string = 'user'): Promise<DbUser> {
    const result = await sql`
        INSERT INTO users (email, name, password_hash, role, credits)
        VALUES (${email}, ${name}, ${passwordHash}, ${role}, 0)
        RETURNING *
    `;
    return result[0] as DbUser;
}

export async function updateUserCredits(email: string, credits: number): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET credits = ${credits}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}

export async function deductCredits(email: string, amount: number): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET credits = credits - ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email} AND credits >= ${amount}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}

export async function addCredits(email: string, amount: number): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET credits = credits + ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}

export async function getAllUsers(): Promise<Omit<DbUser, 'password_hash'>[]> {
    const result = await sql`
        SELECT id, email, name, credits, role, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC
    `;
    return result as Omit<DbUser, 'password_hash'>[];
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
    const result = await sql`DELETE FROM users WHERE email = ${email}`;
    return result.length >= 0;
}

export async function updateUserRole(email: string, role: string): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET role = ${role}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}

// Session functions
export interface DbSession {
    session_id: string;
    username: string;
    expires_at: number;
    created_at: Date;
}

export async function createDbSession(sessionId: string, username: string, expiresAt: number): Promise<void> {
    await sql`
        INSERT INTO sessions (session_id, username, expires_at)
        VALUES (${sessionId}, ${username}, ${expiresAt})
        ON CONFLICT (session_id) DO UPDATE SET expires_at = ${expiresAt}
    `;
}

export async function getDbSession(sessionId: string): Promise<DbSession | null> {
    const result = await sql`
        SELECT * FROM sessions 
        WHERE session_id = ${sessionId} AND expires_at > ${Date.now()}
    `;
    return result[0] as DbSession || null;
}

export async function deleteDbSession(sessionId: string): Promise<void> {
    await sql`DELETE FROM sessions WHERE session_id = ${sessionId}`;
}

export async function deleteExpiredSessions(): Promise<void> {
    await sql`DELETE FROM sessions WHERE expires_at < ${Date.now()}`;
}

export async function updateUserStatus(email: string, status: string): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}
