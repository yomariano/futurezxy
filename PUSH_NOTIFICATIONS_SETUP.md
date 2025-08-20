# Push Notifications Setup Guide

This guide explains how to set up push notifications for your FutureZXY trading app to work on Android Chrome browsers.

## Features Implemented

✅ **Service Worker**: Handles push notifications in the background  
✅ **PWA Manifest**: Makes the app installable on mobile devices  
✅ **Notification Permission UI**: User-friendly notification setup  
✅ **Push Subscription Management**: Subscribe/unsubscribe functionality  
✅ **Notification API**: Server-side notification sending  
✅ **Trading Signal Alerts**: Automatic notifications for trading signals

## How It Works on Android Chrome

1. **Service Worker Registration**: Automatically registers when the app loads
2. **Permission Request**: Users can enable notifications via the UI
3. **Push Subscription**: Creates a unique subscription for the device
4. **Background Notifications**: Receives notifications even when app is closed
5. **Notification Actions**: Click to open app or dismiss

## VAPID Keys Setup (Required for Production)

To send push notifications in production, you need to generate VAPID keys:

### 1. Generate VAPID Keys

```bash
# Install web-push CLI globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output:

```
=======================================
Subject: mailto:your-email@example.com

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa40HI80xmqaFktdOiMJvxaHci6SQ6BE-hQw3DBh6bOZ0TLb_WkE3CVJZ-QPg0

Private Key:
your-private-key-here
=======================================
```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_EMAIL=mailto:your-email@example.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Update the Code

The code already includes placeholder VAPID keys for development. Replace them with your generated keys in:

- `/lib/push-notifications.ts` (public key)
- `/app/api/notifications/route.ts` (private key and email)

## Testing Push Notifications

### 1. Local Development

1. Start your development server: `npm run dev`
2. Open the app in Chrome (localhost)
3. Navigate to the Signals page
4. Click "Enable Notifications"
5. Allow notifications when prompted
6. Click "Test" to send a test notification

### 2. Android Chrome Testing

1. Deploy your app with HTTPS (required for service workers)
2. Open the app in Chrome on Android
3. Enable notifications through the UI
4. Add the app to your home screen (PWA install)
5. Test notifications by calling the trigger API:

```bash
curl -X POST https://your-domain.com/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "trading_signal",
    "data": {
      "pair": "BTC/USDT",
      "type": "BUY",
      "price": 45000,
      "rsi": 30
    }
  }'
```

## API Endpoints

### Subscribe to Notifications

```
POST /api/notifications/subscribe
{
  "subscription": {...},
  "userId": "optional-user-id"
}
```

### Send Single Notification

```
POST /api/notifications
{
  "subscription": {...},
  "payload": {
    "title": "Alert Title",
    "body": "Alert message"
  }
}
```

### Send Bulk Notifications

```
POST /api/notifications
{
  "subscriptions": [...],
  "payload": {
    "title": "Alert Title",
    "body": "Alert message"
  }
}
```

### Trigger Trading Signal

```
POST /api/notifications/trigger
{
  "type": "trading_signal",
  "data": {
    "pair": "BTC/USDT",
    "type": "BUY",
    "price": 45000
  }
}
```

### Test Notification

```
GET /api/notifications/trigger/test
```

## Integration with Trading Signals

To automatically send notifications when trading signals are detected, integrate with your existing signal detection code:

```typescript
import { sendTradingAlert } from "@/lib/notification-sender";

// When a new signal is detected
await sendTradingAlert({
  pair: "BTC/USDT",
  type: "BUY",
  price: 45000,
  rsi: 30,
  wavetrend: "oversold",
});
```

## Browser Support

✅ **Chrome on Android**: Full support  
✅ **Chrome on Desktop**: Full support  
✅ **Firefox**: Full support  
✅ **Edge**: Full support  
❌ **Safari**: Limited support (iOS Safari doesn't support push notifications for web apps)

## Security Considerations

1. **HTTPS Required**: Service workers and push notifications require HTTPS
2. **VAPID Keys**: Keep private keys secure and never expose them client-side
3. **User Consent**: Always request permission before subscribing to notifications
4. **Subscription Management**: Provide easy way to unsubscribe

## Troubleshooting

### Service Worker Not Registering

- Ensure you're using HTTPS or localhost
- Check browser console for errors
- Verify `/sw.js` is accessible

### Notifications Not Appearing

- Check notification permissions in browser settings
- Verify VAPID keys are correct
- Check network requests in browser dev tools

### Subscription Failures

- Ensure VAPID public key is correct
- Check if user denied notification permission
- Verify service worker is registered and active

## Production Deployment

1. Generate and configure VAPID keys
2. Deploy with HTTPS enabled
3. Test on actual Android devices
4. Monitor notification delivery rates
5. Set up subscription cleanup for invalid endpoints

## Next Steps

- Integrate with user authentication for personalized notifications
- Add notification preferences (frequency, types)
- Implement rich notifications with images and actions
- Set up analytics to track notification engagement
- Add support for time-zone aware notifications



