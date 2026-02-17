export type UserRole = 'admin' | 'user';

export interface UserPermission {
    page: string;
    granted: boolean;
}

export interface User {
    username: string;
    email?: string;
    name?: string;
    passwordHash: string;
    role: UserRole;
    status?: 'active' | 'pending' | 'disabled';
    authorizedPages?: string[];
    customTitle?: string;
    customLogo?: string;
    customSettings?: Record<string, any>;
    credits: number;
    createdAt?: number;
    lastLogin?: number;
    authType?: 'credentials' | 'google';
}

export interface Session {
    sessionId: string;
    username: string;
    expiresAt: number;
}
