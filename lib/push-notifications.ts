// Push Notifications Utility Library

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

/**
 * Check if push notifications are supported in the current browser
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  return permission;
}

/**
 * Register service worker and get push subscription
 */
export async function registerServiceWorkerAndSubscribe(): Promise<PushSubscription | null> {
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    return subscription;
  } catch (error) {
    console.error(
      "Error registering service worker or subscribing to push:",
      error
    );
    return null;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  if (typeof window === 'undefined') {
    // Server-side fallback - return empty array
    return new Uint8Array(0);
  }

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  subscription?: PushSubscriptionData;
  error?: string;
}> {
  try {
    // Check if supported
    if (!isPushNotificationSupported()) {
      return {
        success: false,
        error: "Push notifications are not supported in this browser",
      };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error: "Notification permission was denied",
      };
    }

    // Register service worker and subscribe
    const subscription = await registerServiceWorkerAndSubscribe();
    if (!subscription) {
      return {
        success: false,
        error: "Failed to create push subscription",
      };
    }

    // Convert subscription to our format
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
        ),
        auth: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
        ),
      },
    };

    return {
      success: true,
      subscription: subscriptionData,
    };
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

/**
 * Check current subscription status
 */
export async function getSubscriptionStatus(): Promise<{
  isSubscribed: boolean;
  subscription?: PushSubscriptionData;
}> {
  try {
    if (!isPushNotificationSupported()) {
      return { isSubscribed: false };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { isSubscribed: false };
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { isSubscribed: false };
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
        ),
        auth: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
        ),
      },
    };

    return {
      isSubscribed: true,
      subscription: subscriptionData,
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return { isSubscribed: false };
  }
}

/**
 * Show a local notification (for testing)
 */
export function showLocalNotification(payload: NotificationPayload): void {
  if (!isPushNotificationSupported()) {
    console.error("Notifications are not supported");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/images/logo.png",
      badge: payload.badge || "/images/logo.png",
      tag: payload.tag || "local-notification",
    });
  }
}



