import { buffer } from 'micro'
import Stripe from 'stripe'
import { NextApiRequest, NextApiResponse } from 'next'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']!

  try {
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break
      // Add other cases as needed
    }

    res.json({ received: true })
  } catch (err) {
    const error = err as Error
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
}
