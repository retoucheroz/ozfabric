import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Kritik Admin Hesaplarını Kontrol Eder (Kırılmaz Liste)
 */
const checkIsPrimaryAdmin = (email?: string | null, name?: string | null) => {
    const e = email?.toLowerCase().trim();
    const n = name?.toLowerCase().trim();
    const primaryAdmins = [
        'admin',
        'kilicozzgur@gmail.com',
        'retoucheroz',
        'retoucheroz@gmail.com',
        'ozfabric'
    ];
    return primaryAdmins.includes(e || '') || primaryAdmins.includes(n || '');
};

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
    pages: { signIn: '/login', error: '/login' },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                login: { label: 'Email or Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.login || !credentials?.password) return null
                const login = credentials.login as string
                const password = credentials.password as string

                let user = await prisma.user.findFirst({
                    where: { OR: [{ email: login }, { name: login }] },
                })

                if (!user && login.toLowerCase() === 'kilicozzgur@gmail.com') {
                    user = await prisma.user.findFirst({
                        where: { OR: [{ email: 'admin' }, { name: 'admin' }, { name: 'Admin' }] }
                    })
                    if (user) {
                        await prisma.user.update({ where: { id: user.id }, data: { email: login.toLowerCase() } })
                    }
                }

                if (!user || !user.passwordHash) return null
                let isValid = await bcrypt.compare(password, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user.id, email: user.email, name: user.name,
                    role: user.role, credits: user.credits, status: user.status,
                    authorizedPages: user.authorizedPages, customTitle: user.customTitle,
                    customLogo: user.customLogo, authType: user.authType,
                } as any
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // İlk giriş veya zorunlu yükleme
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name || user.email?.split('@')[0] || 'User'
                token.credits = (user as any).credits || 0
                token.status = (user as any).status || 'active'
                token.authorizedPages = (user as any).authorizedPages || []
            }

            // Session güncellemeleri (kredi değişimi vb.)
            if (trigger === 'update' && session) {
                if (session.credits !== undefined) token.credits = session.credits
                if (session.authorizedPages) token.authorizedPages = session.authorizedPages
            }

            // DB'den veriyi tazele (Eksik alan varsa)
            if (token.id && !user && !token._loaded) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                    })
                    if (dbUser) {
                        token.name = dbUser.name || token.name
                        token.email = dbUser.email || token.email
                        token.credits = dbUser.credits
                        token.status = dbUser.status
                        token.authorizedPages = dbUser.authorizedPages
                        token._loaded = true
                    }
                } catch (e) { console.error(e) }
            }

            // === KRİTİK GÜVENLİK KURALI ===
            // Her JWT tazelemessinde rolü zorla kontrol et
            token.role = checkIsPrimaryAdmin(token.email as string, token.name as string) ? 'admin' : 'user'

            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.credits = token.credits as number
                session.user.status = token.status as string
                session.user.email = token.email as string
                session.user.name = token.name as string
            }
            return session
        },

        async signIn({ user, account }) {
            if (account?.provider === 'credentials') {
                const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
                const isAdmin = checkIsPrimaryAdmin(dbUser?.email, dbUser?.name);
                if (!isAdmin && !dbUser?.emailVerified) return false
            }
            return true
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
}
