import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Lemon Squeezy variant → kredi mapping
const CREDIT_PACKS: Record<string, { credits: number; variantId: string }> = {
    credits_500: { credits: 500, variantId: process.env.LEMON_VARIANT_500! },
    credits_1100: { credits: 1100, variantId: process.env.LEMON_VARIANT_1100! },
    credits_6000: { credits: 6000, variantId: process.env.LEMON_VARIANT_6000! },
    credits_13000: { credits: 13000, variantId: process.env.LEMON_VARIANT_13000! },
}

const SUBSCRIPTIONS: Record<string, { variantId: string }> = {
    sub_pro: { variantId: process.env.LEMON_VARIANT_PRO! },
    sub_business: { variantId: process.env.LEMON_VARIANT_BUSINESS! },
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { productKey } = await req.json()
        const pack = CREDIT_PACKS[productKey] || SUBSCRIPTIONS[productKey]

        if (!pack) {
            return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
        }

        // Lemon Squeezy checkout oluştur
        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            custom: {
                                user_id: session.user.id,
                            },
                        },
                        product_options: {
                            redirect_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
                        },
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: process.env.LEMON_SQUEEZY_STORE_ID!,
                            },
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: (pack as any).variantId,
                            },
                        },
                    },
                },
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Lemon checkout error:', data)
            return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
        }

        const checkoutUrl = data.data.attributes.url
        return NextResponse.json({ url: checkoutUrl })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
