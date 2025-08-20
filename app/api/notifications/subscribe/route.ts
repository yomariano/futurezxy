import { NextRequest, NextResponse } from "next/server";

// In a real app, you'd store these in a database
// For now, we'll use a simple in-memory store
const subscriptions = new Map<string, any>();

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// POST /api/notifications/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Store subscription (in production, save to database)
    const subscriptionKey = userId || subscription.endpoint;
    subscriptions.set(subscriptionKey, {
      ...subscription,
      userId,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    console.log(`Stored subscription for ${subscriptionKey}`);

    return NextResponse.json({
      success: true,
      message: "Subscription stored successfully",
    });
  } catch (error) {
    console.error("Error storing subscription:", error);
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

// GET /api/notifications/subscribe - Get all subscriptions (for testing)
export async function GET() {
  try {
    const allSubscriptions = Array.from(subscriptions.entries()).map(
      ([key, sub]) => ({
        key,
        endpoint: sub.endpoint,
        userId: sub.userId,
        createdAt: sub.createdAt,
        isActive: sub.isActive,
      })
    );

    return NextResponse.json({
      success: true,
      count: allSubscriptions.length,
      subscriptions: allSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// Export function to get all active subscriptions (for internal use)
export function getAllActiveSubscriptions(): PushSubscriptionData[] {
  return Array.from(subscriptions.values())
    .filter((sub) => sub.isActive)
    .map((sub) => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }));
}



