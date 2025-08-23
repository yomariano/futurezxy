import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Initialize web-push configuration only when needed
function initializeWebPush() {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_EMAIL = process.env.VAPID_EMAIL;

  console.log('🔑 Initializing WebPush with VAPID keys...');
  console.log('📧 VAPID Email:', VAPID_EMAIL ? '✅ Set' : '❌ Missing');
  console.log('🔓 Public Key:', VAPID_PUBLIC_KEY ? `✅ Set (${VAPID_PUBLIC_KEY.substring(0, 20)}...)` : '❌ Missing');
  console.log('🔐 Private Key:', VAPID_PRIVATE_KEY ? '✅ Set (hidden)' : '❌ Missing');

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    throw new Error('VAPID keys not configured. Please set VAPID environment variables.');
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ WebPush VAPID details configured successfully');
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

interface SendNotificationRequest {
  subscription: PushSubscriptionData;
  payload: NotificationPayload;
}

interface SendBulkNotificationRequest {
  subscriptions: PushSubscriptionData[];
  payload: NotificationPayload;
}

// POST /api/notifications - Send push notification
export async function POST(request: NextRequest) {
  try {
    initializeWebPush();
    const body = await request.json();

    // Handle bulk notifications
    if (body.subscriptions && Array.isArray(body.subscriptions)) {
      return handleBulkNotification(body as SendBulkNotificationRequest);
    }

    // Handle single notification
    if (body.subscription && body.payload) {
      return handleSingleNotification(body as SendNotificationRequest);
    }

    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing notification request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle single notification
async function handleSingleNotification(data: SendNotificationRequest) {
  try {
    const { subscription, payload } = data;

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const notificationPayload = JSON.stringify(payload);

    await webpush.sendNotification(pushSubscription, notificationPayload);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending single notification:", error);

    // Handle specific push errors
    if (error && typeof error === "object" && "statusCode" in error) {
      const pushError = error as any;
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        // Subscription is no longer valid
        return NextResponse.json(
          {
            success: false,
            error: "Subscription is no longer valid",
            shouldUnsubscribe: true,
          },
          { status: 410 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send notification",
      },
      { status: 500 }
    );
  }
}

// Handle bulk notifications
async function handleBulkNotification(data: SendBulkNotificationRequest) {
  try {
    const { subscriptions, payload } = data;
    console.log('📨 Sending bulk notifications...');
    console.log(`📊 Subscriptions to notify: ${subscriptions.length}`);
    console.log('📝 Payload:', payload);

    const results = [];
    const notificationPayload = JSON.stringify(payload);

    for (const subscription of subscriptions) {
      try {
        console.log(`📤 Sending to: ${subscription.endpoint.substring(0, 50)}...`);
        
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log(`✅ Notification sent successfully to ${subscription.endpoint.substring(0, 50)}...`);
        
        results.push({
          endpoint: subscription.endpoint,
          success: true,
        });
      } catch (error) {
        console.error(
          `❌ Error sending notification to ${subscription.endpoint.substring(0, 50)}...:`,
          error
        );

        let shouldUnsubscribe = false;
        if (error && typeof error === "object" && "statusCode" in error) {
          const pushError = error as any;
          console.log(`🚫 Push error status code: ${pushError.statusCode}`);
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            shouldUnsubscribe = true;
            console.log(`🗑️ Subscription should be removed (${pushError.statusCode})`);
          }
        }

        results.push({
          endpoint: subscription.endpoint,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          shouldUnsubscribe,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📈 Results: ${successCount} success, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("❌ Error sending bulk notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send bulk notifications",
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications/vapid - Get VAPID public key
export async function GET() {
  try {
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!VAPID_PUBLIC_KEY) {
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey: VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    );
  }
}



