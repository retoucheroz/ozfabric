// Simple file-based user storage fallback for production without KV
import fs from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), '.data', 'users.json');

export async function ensureDataDir() {
    const dir = path.dirname(USERS_FILE);
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {
        // Directory might already exist
    }
}

export async function readUsersFile(): Promise<Record<string, any>> {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

export async function writeUsersFile(users: Record<string, any>) {
    await ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}
