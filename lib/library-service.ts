import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "");

export interface GlobalLibraryItem {
    id: string;
    category: string;
    data: any;
    created_at: Date;
}

// Auto-create the table if it doesn't exist — no manual migration needed
async function ensureTable() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS global_library (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `;
    } catch (e) {
        console.warn('[library-service] ensureTable warning:', e);
    }
}

export async function getGlobalLibraryItems(category?: string, onlyPublic: boolean = false): Promise<GlobalLibraryItem[]> {
    await ensureTable();
    if (category && onlyPublic) {
        return (await sql`SELECT * FROM global_library WHERE category = ${category} AND (data->>'is_public' = 'true' OR data->>'is_public' IS NULL) ORDER BY created_at DESC`) as GlobalLibraryItem[];
    } else if (category) {
        return (await sql`SELECT * FROM global_library WHERE category = ${category} ORDER BY created_at DESC`) as GlobalLibraryItem[];
    } else if (onlyPublic) {
        return (await sql`SELECT * FROM global_library WHERE (data->>'is_public' = 'true' OR data->>'is_public' IS NULL) ORDER BY created_at DESC`) as GlobalLibraryItem[];
    }
    return (await sql`SELECT * FROM global_library ORDER BY created_at DESC`) as GlobalLibraryItem[];
}

export async function addGlobalLibraryItem(category: string, data: any, isPublic: boolean = true) {
    await ensureTable();
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const finalData = { ...data, is_public: isPublic };
    const result = await sql`
        INSERT INTO global_library (id, category, data)
        VALUES (${id}, ${category}, ${JSON.stringify(finalData)})
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function updateGlobalLibraryItem(id: string, data: any, isPublic?: boolean) {
    await ensureTable();
    const finalData = isPublic !== undefined ? { ...data, is_public: isPublic } : data;
    const result = await sql`
        UPDATE global_library 
        SET data = ${JSON.stringify(finalData)}
        WHERE id = ${id}
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function deleteGlobalLibraryItem(id: string) {
    await ensureTable();
    await sql`DELETE FROM global_library WHERE id = ${id}`;
}
