import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID details inside functions to ensure env vars are loaded
const configureVAPID = () => {
  const email = process.env.VAPID_EMAIL || 'noreply@signalstrading.app';
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '961o30M51vXuJYD_IZcB7MhuMtvs8-b1TWsdVy7qaEo';

  console.log('Configuring VAPID with:');
  console.log('- Email:', email);
  console.log('- Public key length:', publicKey?.length);
  console.log('- Private key length:', privateKey?.length);
  console.log('- Public key (first 20 chars):', publicKey?.substring(0, 20) + '...');
  console.log('- Private key (first 10 chars):', privateKey?.substring(0, 10) + '...');

  // Test key decoding
  try {
    const publicDecoded = Buffer.from(publicKey, 'base64url');
    const privateDecoded = Buffer.from(privateKey, 'base64url');
    console.log('- Decoded public key length:', publicDecoded.length, 'bytes');
    console.log('- Decoded private key length:', privateDecoded.length, 'bytes');
    
    if (privateDecoded.length !== 32) {
      throw new Error(`Private key is ${privateDecoded.length} bytes, should be 32 bytes`);
    }
  } catch (decodeError) {
    console.error('Key decoding error:', decodeError);
    throw decodeError;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  console.log('✅ VAPID configured successfully');
};

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
    // Configure VAPID before processing the request
    configureVAPID();
    
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
  try {
    configureVAPID();
    return NextResponse.json({
      success: true,
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/push:', error);
    return NextResponse.json({
      success: false,
      error: 'VAPID configuration failed'
    }, { status: 500 });
  }
}