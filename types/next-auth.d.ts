import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            role: string
            credits: number
            status: string
            authorizedPages: string[]
            customTitle?: string | null
            customLogo?: string | null
            authType: string
        } & DefaultSession['user']
    }

    interface User extends DefaultUser {
        role: string
        credits: number
        status: string
        authorizedPages: string[]
        customTitle?: string | null
        customLogo?: string | null
        authType: string
        passwordHash?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        id: string
        role: string
        credits: number
        status: string
        authorizedPages: string[]
        customTitle?: string | null
        customLogo?: string | null
        authType: string
    }
}
