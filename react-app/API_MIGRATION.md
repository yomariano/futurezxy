# API Migration Notes

The following Next.js API routes need to be migrated to a separate backend or implemented as client-side logic:

## API Routes from Next.js App:
- `/api/alerts/route.ts` - Alert settings management
- `/api/chat/route.ts` - Chat functionality
- `/api/create-checkout-session/route.ts` - Stripe checkout
- `/api/debug/notifications/route.ts` - Debug notifications
- `/api/notifications/` - Various notification endpoints
- `/api/pairs/route.ts` - Trading pairs management
- `/api/trading-signal/route.ts` - Trading signals
- `/api/webhook.ts` - Webhook handlers

## Stripe Webhook:
- `api/stripe-webhook.ts` - Stripe webhook handler

## Migration Options:

### Option 1: Separate Backend
Create a separate Node.js/Express backend or use a service like Supabase Edge Functions to handle these API endpoints.

### Option 2: Client-side Implementation
For some endpoints like pairs management, implement the logic directly in React components using client-side libraries and external APIs.

### Option 3: Serverless Functions
Use services like Vercel Functions, Netlify Functions, or AWS Lambda to host these API endpoints separately.

## Current Status:
- API routes have been documented
- Components still reference these routes and will need updates
- Database operations (Supabase) will need to be moved to client-side or separate backend