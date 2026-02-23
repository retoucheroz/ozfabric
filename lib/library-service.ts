import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "");

export interface GlobalLibraryItem {
    id: string;
    category: string; // 'pose', 'model', 'background', 'lighting', etc.
    data: any;
    created_at: Date;
}

export async function getGlobalLibraryItems(category?: string): Promise<GlobalLibraryItem[]> {
    if (category) {
        const result = await sql`SELECT * FROM global_library WHERE category = ${category} ORDER BY created_at DESC`;
        return result as GlobalLibraryItem[];
    }
    const result = await sql`SELECT * FROM global_library ORDER BY created_at DESC`;
    return result as GlobalLibraryItem[];
}

export async function addGlobalLibraryItem(category: string, data: any) {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const result = await sql`
        INSERT INTO global_library (id, category, data)
        VALUES (${id}, ${category}, ${data})
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function updateGlobalLibraryItem(id: string, data: any) {
    const result = await sql`
        UPDATE global_library 
        SET data = ${data}
        WHERE id = ${id}
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function deleteGlobalLibraryItem(id: string) {
    await sql`DELETE FROM global_library WHERE id = ${id}`;
}
