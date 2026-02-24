import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/auth-helpers'
import crypto from 'crypto'

// Variant ID → kredi mapping
const VARIANT_CREDITS: Record<string, number> = {
    [process.env.LEMON_VARIANT_500 || '']: 500,
    [process.env.LEMON_VARIANT_1100 || '']: 1100,
    [process.env.LEMON_VARIANT_6000 || '']: 6000,
    [process.env.LEMON_VARIANT_13000 || '']: 13000,
}

const SUBSCRIPTION_CREDITS: Record<string, { credits: number; plan: string }> = {
    [process.env.LEMON_VARIANT_PRO || '']: { credits: 3500, plan: 'pro' },
    [process.env.LEMON_VARIANT_BUSINESS || '']: { credits: 12000, plan: 'business' },
}

// HMAC signature verification
function verifySignature(rawBody: string, signature: string): boolean {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(rawBody).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get('x-signature') || ''

        // 1. Signature doğrula
        if (!verifySignature(rawBody, signature)) {
            console.error('❌ Webhook: Invalid signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(rawBody)
        const eventName = payload.meta.event_name
        const eventId = payload.meta.custom_data?.event_id || payload.data.id

        // 2. Idempotency check
        const existingTx = await prisma.lemonTransaction.findUnique({
            where: { eventId: String(eventId) },
        })
        if (existingTx) {
            console.log(`⚠️ Webhook: Duplicate event ${eventId}, skipping`)
            return NextResponse.json({ ok: true })
        }

        const userId = payload.meta.custom_data?.user_id
        if (!userId) {
            console.error('❌ Webhook: No user_id in custom data')
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
        }

        // User var mı kontrol et
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            console.error(`❌ Webhook: User ${userId} not found`)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const variantId = String(payload.data.attributes.first_order_item?.variant_id || payload.data.attributes.variant_id || '')
        const amountPaid = payload.data.attributes.total || payload.data.attributes.subtotal || 0
        const currency = payload.data.attributes.currency || 'USD'

        // 3. Event'e göre işle
        switch (eventName) {
            case 'order_created': {
                const credits = VARIANT_CREDITS[variantId]
                if (!credits) {
                    console.error(`❌ Webhook: Unknown variant ${variantId}`)
                    return NextResponse.json({ error: 'Unknown variant' }, { status: 400 })
                }

                await addCredits(userId, credits, `Credit pack purchase (${credits} credits)`, 'purchase')

                await prisma.lemonTransaction.create({
                    data: {
                        eventId: String(eventId),
                        userId,
                        eventType: eventName,
                        variantId,
                        creditsAdded: credits,
                        amountPaid: Number(amountPaid),
                        currency,
                        rawPayload: payload,
                    },
                })

                console.log(`✅ Webhook: Added ${credits} credits to user ${userId}`)
                break
            }

            case 'subscription_created':
            case 'subscription_payment_success': {
                const sub = SUBSCRIPTION_CREDITS[variantId]
                if (!sub) {
                    console.error(`❌ Webhook: Unknown subscription variant ${variantId}`)
                    return NextResponse.json({ error: 'Unknown variant' }, { status: 400 })
                }

                await addCredits(userId, sub.credits, `Subscription (${sub.plan}) — ${sub.credits} credits`, 'subscription')

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionPlan: sub.plan,
                        subscriptionStatus: 'active',
                        subscriptionId: String(payload.data.id),
                        lemonCustomerId: String(payload.data.attributes.customer_id || ''),
                    },
                })

                await prisma.lemonTransaction.create({
                    data: {
                        eventId: String(eventId),
                        userId,
                        eventType: eventName,
                        variantId,
                        creditsAdded: sub.credits,
                        amountPaid: Number(amountPaid),
                        currency,
                        rawPayload: payload,
                    },
                })

                console.log(`✅ Webhook: Subscription ${sub.plan} — added ${sub.credits} credits to user ${userId}`)
                break
            }

            case 'subscription_cancelled':
            case 'subscription_expired': {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionStatus: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
                    },
                })
                console.log(`⚠️ Webhook: Subscription ${eventName} for user ${userId}`)
                break
            }

            default:
                console.log(`ℹ️ Webhook: Unhandled event ${eventName}`)
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('❌ Webhook error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
