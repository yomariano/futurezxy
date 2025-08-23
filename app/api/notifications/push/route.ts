import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushNotificationRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: PushNotificationRequest = await request.json();
    
    if (!body.subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription is required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: body.title || 'FutureZXY Alert',
      body: body.body || 'New trading signal available',
      icon: body.icon || '/favicon.ico',
      badge: body.badge || '/favicon.ico',
      tag: body.tag || 'trading-alert',
      url: body.url || '/signals',
      data: body.data || {},
      timestamp: Date.now(),
    });

    const options = {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: 'high' as const,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log('Sending push notification:', {
      subscription: body.subscription.endpoint,
      payload: payload,
    });

    await webpush.sendNotification(body.subscription, payload, options);

    return NextResponse.json({
      success: true,
      message: 'Push notification sent successfully',
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Handle specific web-push errors
    if (error instanceof Error) {
      if (error.message.includes('410') || error.message.includes('expired')) {
        return NextResponse.json(
          { success: false, error: 'Subscription expired', code: 'EXPIRED' },
          { status: 410 }
        );
      }
      
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: 'Invalid subscription', code: 'INVALID' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

// Get VAPID public key for client-side subscription
export async function GET() {
  return NextResponse.json({
    success: true,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
}