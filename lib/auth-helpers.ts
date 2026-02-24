import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Server-side session alma
export async function getSession() {
    return await getServerSession(authOptions)
}

// Authenticated user kontrolü (API route'lar için)
export async function requireAuth() {
    const session = await getSession()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }
    return session.user
}

// Admin kontrolü
export async function requireAdmin() {
    const user = await requireAuth()
    if (user.role !== 'admin') {
        throw new Error('Forbidden')
    }
    return user
}

// Kredi düşürme (atomik)
export async function deductCredits(userId: string, amount: number, description: string = 'Image Generation') {
    return await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        })

        if (!user || user.credits < amount) {
            throw new Error('Insufficient credits')
        }

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { credits: { decrement: amount } },
        })

        await tx.creditTransaction.create({
            data: {
                userId,
                amount: -amount,
                description,
                type: 'usage',
            },
        })

        return updatedUser
    })
}

// Kredi ekleme (webhook'tan çağrılır)
export async function addCredits(userId: string, amount: number, description: string, type: string = 'deposit') {
    return await prisma.$transaction(async (tx: any) => {
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } },
        })

        await tx.creditTransaction.create({
            data: {
                userId,
                amount,
                description,
                type,
            },
        })

        return updatedUser
    })
}

// Activity tracking
export async function updateUserActivity(userId: string, page: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastSeenAt: new Date(),
                lastSeenPage: page,
            },
        })
    } catch (e) {
        // Silently ignore
    }
}
