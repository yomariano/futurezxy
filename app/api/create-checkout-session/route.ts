import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plan } = body

    // Define prices based on plan
    const prices = {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: prices[plan as keyof typeof prices],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${DOMAIN}/dashboard?success=true`,
      cancel_url: `${DOMAIN}/billing?canceled=true`,
      automatic_tax: { enabled: true },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    )
  }
} 