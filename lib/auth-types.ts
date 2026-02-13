
export type UserRole = 'admin' | 'user';

export interface UserPermission {
    page: string;
    granted: boolean;
}

export interface User {
    username: string;
    passwordHash: string;
    role: UserRole;
    status: 'active' | 'pending' | 'disabled';
    authorizedPages: string[];
    customTitle?: string;
    customSettings?: Record<string, any>;
    createdAt: number;
    lastLogin?: number;
}

export interface Session {
    sessionId: string;
    username: string;
    expiresAt: number;
}
