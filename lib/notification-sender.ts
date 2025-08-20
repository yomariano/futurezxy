// Server-side notification sender utility

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to all subscribed users
 */
export async function sendBulkNotification(
  payload: NotificationPayload
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    total: number;
    success: number;
    failed: number;
  };
}> {
  try {
    // Get all subscriptions from the subscribe endpoint
    const subscriptionsResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/notifications/subscribe`,
      {
        method: "GET",
      }
    );

    if (!subscriptionsResponse.ok) {
      throw new Error("Failed to fetch subscriptions");
    }

    const subscriptionsData = await subscriptionsResponse.json();

    if (!subscriptionsData.success || subscriptionsData.count === 0) {
      return {
        success: true,
        message: "No active subscriptions found",
      };
    }

    // Convert subscriptions to the format expected by the notifications API
    const subscriptions = subscriptionsData.subscriptions.map((sub: any) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys?.p256dh || "",
        auth: sub.keys?.auth || "",
      },
    }));

    // Send bulk notification
    const notificationResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptions,
          payload,
        }),
      }
    );

    const result = await notificationResponse.json();

    if (result.success) {
      return {
        success: true,
        message: result.message,
        stats: result.stats,
      };
    } else {
      throw new Error(result.error || "Failed to send notifications");
    }
  } catch (error) {
    console.error("Error sending bulk notification:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send notification for trading signal alerts
 */
export async function sendTradingAlert(signal: {
  pair: string;
  type: "BUY" | "SELL";
  price?: number;
  rsi?: number;
  wavetrend?: string;
}): Promise<void> {
  const payload: NotificationPayload = {
    title: `${signal.type} Signal: ${signal.pair}`,
    body: `New ${signal.type.toLowerCase()} signal detected for ${signal.pair}${
      signal.price ? ` at $${signal.price}` : ""
    }`,
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: `trading-signal-${signal.pair}`,
    url: "/signals",
    data: {
      pair: signal.pair,
      type: signal.type,
      price: signal.price,
      rsi: signal.rsi,
      wavetrend: signal.wavetrend,
      timestamp: Date.now(),
    },
  };

  const result = await sendBulkNotification(payload);

  if (result.success) {
    console.log(`Trading alert sent: ${result.message}`);
  } else {
    console.error(`Failed to send trading alert: ${result.message}`);
  }
}

/**
 * Send general app notifications
 */
export async function sendAppNotification(
  title: string,
  body: string,
  options?: {
    url?: string;
    tag?: string;
    data?: Record<string, any>;
  }
): Promise<void> {
  const payload: NotificationPayload = {
    title,
    body,
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: options?.tag || "app-notification",
    url: options?.url || "/",
    data: {
      ...options?.data,
      timestamp: Date.now(),
    },
  };

  const result = await sendBulkNotification(payload);

  if (result.success) {
    console.log(`App notification sent: ${result.message}`);
  } else {
    console.error(`Failed to send app notification: ${result.message}`);
  }
}



