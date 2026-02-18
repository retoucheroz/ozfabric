import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    console.warn("CRITICAL: DATABASE_URL is not set. Database features will fail.");
}

const sql = neon(process.env.DATABASE_URL || "");

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
    authorized_pages: string[] | null;
    custom_title: string | null;
    custom_logo: string | null;
    auth_type: string | null;
    avatar_url: string | null;
}

export interface CreditTransaction {
    id: number;
    user_email: string;
    amount: number;
    description: string | null;
    type: string | null;
    created_at: Date;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0] as DbUser || null;
}

export async function createUser(email: string, name: string | null, passwordHash: string | null, role: string = 'user', authType: string = 'credentials', avatarUrl: string | null = null, authorizedPages: string[] = []): Promise<DbUser> {
    const result = await sql`
        INSERT INTO users (email, name, password_hash, role, credits, auth_type, avatar_url, authorized_pages)
        VALUES (${email}, ${name}, ${passwordHash}, ${role}, 0, ${authType}, ${avatarUrl}, ${authorizedPages})
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

export async function deductCredits(email: string, amount: number, description: string = 'Image Generation'): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET credits = credits - ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email} AND credits >= ${amount}
        RETURNING *
    `;

    if (result[0]) {
        await sql`
            INSERT INTO credit_transactions (user_email, amount, description, type)
            VALUES (${email}, ${-amount}, ${description}, 'usage')
        `;
    }

    return result[0] as DbUser || null;
}

export async function addCredits(email: string, amount: number, description: string = 'Admin Deposit'): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET credits = credits + ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;

    if (result[0]) {
        await sql`
            INSERT INTO credit_transactions (user_email, amount, description, type)
            VALUES (${email}, ${amount}, ${description}, 'deposit')
        `;
    }

    return result[0] as DbUser || null;
}

export async function getAllUsers(): Promise<Omit<DbUser, 'password_hash'>[]> {
    const result = await sql`
        SELECT id, email, name, credits, role, status, authorized_pages, custom_title, custom_logo, auth_type, created_at, updated_at 
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

export async function updateUser(email: string, updates: {
    credits?: number;
    role?: string;
    status?: string;
    authorized_pages?: string[];
    custom_title?: string;
    custom_logo?: string;
    auth_type?: string;
    avatar_url?: string | null;
}): Promise<DbUser | null> {
    const result = await sql`
        UPDATE users 
        SET 
            credits = COALESCE(${updates.credits ?? null}, credits),
            role = COALESCE(${updates.role ?? null}, role),
            status = COALESCE(${updates.status ?? null}, status),
            authorized_pages = COALESCE(${updates.authorized_pages ?? null}::text[], authorized_pages),
            custom_title = COALESCE(${updates.custom_title ?? null}, custom_title),
            custom_logo = COALESCE(${updates.custom_logo ?? null}, custom_logo),
            auth_type = COALESCE(${updates.auth_type ?? null}, auth_type),
            avatar_url = COALESCE(${updates.avatar_url ?? null}, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
    `;
    return result[0] as DbUser || null;
}

export async function getCreditTransactions(email: string): Promise<CreditTransaction[]> {
    const result = await sql`
        SELECT * FROM credit_transactions 
        WHERE user_email = ${email}
        ORDER BY created_at DESC
    `;
    return result as CreditTransaction[];
}

export async function logCreditTransaction(email: string, amount: number, description: string, type: string = 'adjustment'): Promise<void> {
    await sql`
        INSERT INTO credit_transactions (user_email, amount, description, type)
        VALUES (${email}, ${amount}, ${description}, ${type})
    `;
}
