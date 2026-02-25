import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "");

export interface GlobalLibraryItem {
    id: string;
    category: string; // 'pose', 'model', 'background', 'lighting', etc.
    data: any;
    is_public?: boolean;
    created_at: Date;
}

export async function getGlobalLibraryItems(category?: string, onlyPublic: boolean = false): Promise<GlobalLibraryItem[]> {
    let query = `SELECT * FROM global_library`;
    const params: any[] = [];

    if (category && onlyPublic) {
        return (await sql`SELECT * FROM global_library WHERE category = ${category} AND (is_public = true OR is_public IS NULL) ORDER BY created_at DESC`) as GlobalLibraryItem[];
    } else if (category) {
        return (await sql`SELECT * FROM global_library WHERE category = ${category} ORDER BY created_at DESC`) as GlobalLibraryItem[];
    } else if (onlyPublic) {
        return (await sql`SELECT * FROM global_library WHERE (is_public = true OR is_public IS NULL) ORDER BY created_at DESC`) as GlobalLibraryItem[];
    }

    return (await sql`SELECT * FROM global_library ORDER BY created_at DESC`) as GlobalLibraryItem[];
}

export async function addGlobalLibraryItem(category: string, data: any, isPublic: boolean = true) {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const result = await sql`
        INSERT INTO global_library (id, category, data, is_public)
        VALUES (${id}, ${category}, ${data}, ${isPublic})
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function updateGlobalLibraryItem(id: string, data: any, isPublic?: boolean) {
    if (isPublic !== undefined) {
        const result = await sql`
            UPDATE global_library 
            SET data = ${data}, is_public = ${isPublic}
            WHERE id = ${id}
            RETURNING *
        `;
        return result[0] as GlobalLibraryItem;
    }
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
