import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "");

export interface GlobalLibraryItem {
    id: string;
    category: string;
    data: any;
    created_at: Date;
}

export async function getGlobalLibraryItems(category?: string, onlyPublic: boolean = false): Promise<GlobalLibraryItem[]> {
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
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const finalData = { ...data, is_public: isPublic };
    const result = await sql`
        INSERT INTO global_library (id, category, data)
        VALUES (${id}, ${category}, ${finalData})
        RETURNING *
    `;
    return result[0] as GlobalLibraryItem;
}

export async function updateGlobalLibraryItem(id: string, data: any, isPublic?: boolean) {
    if (isPublic !== undefined) {
        const finalData = { ...data, is_public: isPublic };
        const result = await sql`
            UPDATE global_library 
            SET data = ${finalData}
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
