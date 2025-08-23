import { NextRequest, NextResponse } from "next/server";

// In a real app, you'd store these in a database
// For now, we'll use a simple in-memory store
const subscriptions = new Map<string, any>();


// POST /api/notifications/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    console.log('🔔 Subscription request received:', { 
      hasSubscription: !!subscription, 
      userId, 
      endpoint: subscription?.endpoint?.substring(0, 50) + '...' 
    });

    if (!subscription || !subscription.endpoint) {
      console.error('❌ Invalid subscription data:', subscription);
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Store subscription (in production, save to database)
    const subscriptionKey = userId || subscription.endpoint;
    const subscriptionData = {
      ...subscription,
      userId,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    subscriptions.set(subscriptionKey, subscriptionData);

    console.log(`✅ Stored subscription for ${subscriptionKey}`);
    console.log(`📊 Total subscriptions: ${subscriptions.size}`);

    return NextResponse.json({
      success: true,
      message: "Subscription stored successfully",
      debug: {
        subscriptionKey,
        totalSubscriptions: subscriptions.size,
        hasKeys: !!subscription.keys,
        hasP256dh: !!subscription.keys?.p256dh,
        hasAuth: !!subscription.keys?.auth,
      }
    });
  } catch (error) {
    console.error("❌ Error storing subscription:", error);
    return NextResponse.json(
      { error: "Failed to store subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/subscribe - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, userId } = body;

    if (!endpoint && !userId) {
      return NextResponse.json(
        { error: "Endpoint or userId required" },
        { status: 400 }
      );
    }

    const subscriptionKey = userId || endpoint;
    const deleted = subscriptions.delete(subscriptionKey);

    if (deleted) {
      console.log(`Removed subscription for ${subscriptionKey}`);
      return NextResponse.json({
        success: true,
        message: "Subscription removed successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription not found",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error removing subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}

// GET /api/notifications/subscribe - Get all subscriptions (for bulk notifications)
export async function GET() {
  try {
    console.log('📋 Fetching subscriptions...');
    console.log(`📊 Total subscriptions in memory: ${subscriptions.size}`);
    
    const allSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.isActive)
      .map(sub => ({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }));

    console.log(`✅ Active subscriptions: ${allSubscriptions.length}`);
    console.log('🔍 Subscription details:', allSubscriptions.map(sub => ({
      endpoint: sub.endpoint?.substring(0, 50) + '...',
      hasKeys: !!sub.keys,
      hasP256dh: !!sub.keys?.p256dh,
      hasAuth: !!sub.keys?.auth
    })));

    return NextResponse.json({
      success: true,
      count: allSubscriptions.length,
      subscriptions: allSubscriptions,
    });
  } catch (error) {
    console.error("❌ Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}




