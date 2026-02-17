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
    return result.count > 0;
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
