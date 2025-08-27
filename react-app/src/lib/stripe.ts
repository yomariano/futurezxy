// Client-side Stripe configuration
// Note: This file is for frontend use only - uses publishable key, not secret key

import { loadStripe } from '@stripe/stripe-js'

// Load Stripe publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

export default stripePromise

// Export the publishable key for direct use
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
