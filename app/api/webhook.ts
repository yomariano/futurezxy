import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break
      // Add other cases as needed
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return NextResponse.json(
      { message: 'Webhook error' },
      { status: 400 }
    )
  }
}
