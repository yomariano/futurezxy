"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, BellOff, Check, X, Smartphone } from "lucide-react";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getSubscriptionStatus,
  isPushNotificationSupported,
  showLocalNotification,
} from "@/lib/push-notifications";

interface NotificationPermissionProps {
  className?: string;
}

export function NotificationPermission({
  className,
}: NotificationPermissionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    checkNotificationSupport();
    checkSubscriptionStatus();
    updatePermissionStatus();
  }, []);

  const checkNotificationSupport = () => {
    setIsSupported(isPushNotificationSupported());
  };

  const updatePermissionStatus = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setIsSubscribed(status.isSubscribed);
    } catch (err) {
      console.error("Error checking subscription status:", err);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscribeToPushNotifications();

      if (result.success && result.subscription) {
        // Send subscription to server
        const response = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: result.subscription,
            userId: "user-" + Date.now(), // In production, use actual user ID
          }),
        });

        if (response.ok) {
          setIsSubscribed(true);
          updatePermissionStatus();

          // Show test notification
          showLocalNotification({
            title: "FutureZXY Notifications Enabled!",
            body: "You will now receive trading alerts and updates.",
            icon: "/images/logo.png",
          });
        } else {
          throw new Error("Failed to store subscription on server");
        }
      } else {
        throw new Error(result.error || "Failed to subscribe");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to enable notifications";
      setError(errorMessage);
      console.error("Error subscribing to notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        // Remove subscription from server
        const status = await getSubscriptionStatus();
        if (status.subscription) {
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: status.subscription.endpoint,
            }),
          });
        }

        setIsSubscribed(false);
        updatePermissionStatus();
      } else {
        throw new Error("Failed to unsubscribe");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disable notifications";
      setError(errorMessage);
      console.error("Error unsubscribing from notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      showLocalNotification({
        title: "Test Notification",
        body: "This is a test notification from FutureZXY!",
        icon: "/images/logo.png",
        tag: "test-notification",
      });
    } catch (err) {
      console.error("Error sending test notification:", err);
    }
  };

  if (!isSupported) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <Smartphone className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your browser doesn't support push notifications. Try using Chrome
              on Android for the best experience.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isSubscribed
                  ? "Receive instant trading alerts on your device"
                  : "Enable notifications to receive trading alerts"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {permission === "granted" && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {permission === "denied" && <X className="h-4 w-4 text-red-500" />}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex space-x-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === "denied"}
              size="sm"
            >
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Disabling..." : "Disable"}
              </Button>
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
              >
                Test
              </Button>
            </>
          )}
        </div>

        {permission === "denied" && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Notifications are blocked. Please enable them in your browser
            settings and refresh the page.
          </div>
        )}

        {permission === "default" && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Click "Enable Notifications" to receive trading alerts even when the
            app is closed.
          </div>
        )}
      </div>
    </Card>
  );
}

export default NotificationPermission;



