import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    // @ts-ignore — known type mismatch between @next-auth/prisma-adapter and next-auth v4
    adapter: PrismaAdapter(prisma),

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 1 hafta
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    providers: [
        // === GOOGLE LOGIN ===
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                },
            },
        }),

        // === EMAIL/USERNAME + PASSWORD ===
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

                // Email veya username ile ara
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: login },
                            { name: login }, // username olarak name kullanıyoruz
                        ],
                    },
                })

                if (!user || !user.passwordHash) return null

                let isValid = false

                // bcrypt hash'leri "$2" ile başlar
                if (user.passwordHash.startsWith('$2')) {
                    isValid = await bcrypt.compare(password, user.passwordHash)
                } else {
                    // Legacy SHA-256 check (mevcut kullanıcılar için)
                    const encoder = new TextEncoder()
                    const data = encoder.encode(password)
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
                    const hashArray = Array.from(new Uint8Array(hashBuffer))
                    const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
                    isValid = sha256Hash === user.passwordHash

                    // Başarılıysa → bcrypt'e upgrade et
                    if (isValid) {
                        const bcryptHash = await bcrypt.hash(password, 12)
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { passwordHash: bcryptHash },
                        })
                        console.log(`🔄 Upgraded password hash for ${user.email || user.name}`)
                    }
                }

                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    credits: user.credits,
                    status: user.status,
                    authorizedPages: user.authorizedPages,
                    customTitle: user.customTitle,
                    customLogo: user.customLogo,
                    authType: user.authType,
                }
            },
        }),
    ],

    callbacks: {
        // JWT oluşturulduğunda custom field'ları ekle
        async jwt({ token, user, trigger, session }) {
            // İlk login
            if (user) {
                token.id = user.id
                token.role = (user as any).role || 'user'
                token.credits = (user as any).credits || 0
                token.status = (user as any).status || 'active'
                token.authorizedPages = (user as any).authorizedPages || []
                token.customTitle = (user as any).customTitle
                token.customLogo = (user as any).customLogo
                token.authType = (user as any).authType || 'credentials'
            }

            // Session update trigger (client-side update() çağrıldığında)
            if (trigger === 'update' && session) {
                if (session.credits !== undefined) token.credits = session.credits
                if (session.authorizedPages) token.authorizedPages = session.authorizedPages
                if (session.role) token.role = session.role
            }

            // Google login ile gelen kullanıcılar için DB'den custom field'ları çek
            if (token.id && !user) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: {
                            credits: true,
                            role: true,
                            status: true,
                            authorizedPages: true,
                            customTitle: true,
                            customLogo: true,
                            authType: true,
                        },
                    })
                    if (dbUser) {
                        token.credits = dbUser.credits
                        token.role = dbUser.role
                        token.status = dbUser.status
                        token.authorizedPages = dbUser.authorizedPages
                        token.customTitle = dbUser.customTitle
                        token.customLogo = dbUser.customLogo
                        token.authType = dbUser.authType
                    }
                } catch (e) {
                    console.error('JWT callback DB error:', e)
                }
            }

            return token
        },

        // Session'a custom field'ları aktar
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.credits = token.credits
                session.user.status = token.status
                session.user.authorizedPages = token.authorizedPages
                session.user.customTitle = token.customTitle
                session.user.customLogo = token.customLogo
                session.user.authType = token.authType
            }
            return session
        },

        // Google login'de yeni kullanıcıya default değerler ata
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                })

                if (existingUser) {
                    await prisma.user.update({
                        where: { email: user.email! },
                        data: {
                            authType: 'google',
                            lastSeenAt: new Date(),
                        },
                    })
                }
            }
            // ✅ Credentials login → email doğrulanmadıysa engelle
            if (account?.provider === 'credentials') {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { emailVerified: true },
              })

              if (!dbUser?.emailVerified) return false
            }
            return true
        },
    },

    events: {
        // Yeni Google kullanıcısı oluşturulduğunda
        async createUser({ user }) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'user',
                    status: 'active',
                    credits: 0,
                    authType: 'google',
                    authorizedPages: ['/home'],
                },
            })
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
}
