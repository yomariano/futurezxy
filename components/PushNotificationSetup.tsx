'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { subscribeToPushNotifications, getSubscriptionStatus, isPushNotificationSupported } from '@/lib/push-notifications';

export function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(isPushNotificationSupported());
    
    // Check current permission and subscription status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      console.log('📱 Mobile subscription check result:', status);
      setIsSubscribed(status.isSubscribed);
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      // On mobile, sometimes the check fails but subscription might still exist
      // Try an alternative check
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            console.log('📱 Alternative mobile check - subscription found:', !!subscription);
          }
        } catch (altError) {
          console.error('❌ Alternative check also failed:', altError);
        }
      }
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await subscribeToPushNotifications();
      
      if (result.success && result.subscription) {
        // Send subscription to server
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: result.subscription,
            userId: 'anonymous', // You can replace with actual user ID
          }),
        });

        if (response.ok) {
          setIsSubscribed(true);
          setPermission('granted');
          
          // Log subscription success
          window.dispatchEvent(new CustomEvent('pushNotificationSent', {
            detail: {
              message: '✅ Push notification subscription enabled successfully',
              data: { action: 'subscribe', endpoint: result.subscription.endpoint.substring(0, 50) + '...' }
            }
          }));
          
          // Test notification
          await testNotification();
        } else {
          throw new Error('Failed to save subscription to server');
        }
      } else {
        setError(result.error || 'Failed to subscribe to notifications');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      // Dispatch event to log in notification console
      window.dispatchEvent(new CustomEvent('pushNotificationSent', {
        detail: {
          message: '🧪 Test push notification triggered from settings',
          data: { source: 'test-button', timestamp: new Date().toISOString() }
        }
      }));

      const response = await fetch('/api/notifications/test', {
        method: 'GET',
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Test notification sent successfully:', result);
        window.dispatchEvent(new CustomEvent('pushNotificationSent', {
          detail: {
            message: '✅ Test push notification sent successfully',
            data: { result: result.message }
          }
        }));
      } else {
        console.error('Failed to send test notification:', result.error);
        setError(result.error || 'Failed to send test notification');
        window.dispatchEvent(new CustomEvent('pushNotificationSent', {
          detail: {
            message: '❌ Test push notification failed',
            data: { error: result.error }
          }
        }));
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Error sending test notification');
      window.dispatchEvent(new CustomEvent('pushNotificationSent', {
        detail: {
          message: '❌ Test push notification error',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }));
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      // Unsubscribe from browser
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            
            // Remove from server
            await fetch('/api/notifications/subscribe', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
              }),
            });
            
            setIsSubscribed(false);
          }
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Push Notifications Not Supported</h3>
        <p className="text-yellow-700 text-sm">
          Your browser doesn't support push notifications. Please use Chrome, Firefox, or Edge for push notifications.
        </p>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <h3 className="font-semibold text-red-800 mb-2">Push Notifications Blocked</h3>
        <p className="text-red-700 text-sm mb-3">
          Push notifications have been blocked for this site. To enable them:
        </p>
        <ul className="text-red-700 text-sm space-y-1 mb-3 ml-4">
          <li>• Click the lock icon in your address bar</li>
          <li>• Select "Allow" for Notifications</li>
          <li>• Refresh this page</li>
        </ul>
        <Button onClick={() => window.location.reload()} size="sm">
          Refresh Page
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold mb-2">
            Push Notifications for WT1/WT2 Signals
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get instant push notifications when WT1 or WT2 conditions are met on 1m/5m timeframes.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          <div className="text-xs text-gray-500">
            Status: {isSubscribed ? (
              <span className="text-green-600 font-medium">✓ Subscribed</span>
            ) : (
              <span className="text-gray-500">Not subscribed</span>
            )}
            {/* Debug info for troubleshooting */}
            <div className="mt-1 text-xs opacity-50">
              Support: {isSupported ? '✓' : '✗'} | Permission: {permission} | Loading: {isLoading ? '✓' : '✗'}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {isSubscribed ? (
            <>
              <Button 
                onClick={testNotification} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Test Notification
              </Button>
              <Button 
                onClick={handleUnsubscribe} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSubscribe} 
              disabled={isLoading}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Setting up...' : 'Enable Push Notifications'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}