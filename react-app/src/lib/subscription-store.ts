// Subscription store utility for push notifications
// In production, this should be replaced with a proper database

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoredSubscription extends PushSubscriptionData {
  userId?: string;
  createdAt: string;
  isActive: boolean;
}

// In-memory store (replace with database in production)
const subscriptions = new Map<string, StoredSubscription>();

export function getAllActiveSubscriptions(): PushSubscriptionData[] {
  return Array.from(subscriptions.values())
    .filter((sub) => sub.isActive)
    .map((sub) => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }));
}

export function getSubscriptionStore() {
  return subscriptions;
}