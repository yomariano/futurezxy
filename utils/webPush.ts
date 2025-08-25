"use client";

// Direct Web Push API implementation - more reliable than third-party services

declare global {
  interface Window {
    webPushRegistration?: ServiceWorkerRegistration;
  }
}

export const initWebPush = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Web Push not supported');
    return false;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    
    // Store registration globally
    window.webPushRegistration = registration;
    
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
};

export const subscribeToWebPush = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Get service worker registration
    const registration = window.webPushRegistration || await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      
      console.log('New push subscription:', subscription);
    } else {
      console.log('Existing push subscription:', subscription);
    }

    // Send subscription to server
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      }),
    });

    if (response.ok) {
      console.log('✅ Web Push subscription successful');
      return true;
    } else {
      console.error('Failed to save subscription');
      return false;
    }
  } catch (error) {
    console.error('Web Push subscription failed:', error);
    return false;
  }
};

export const sendWebPushNotification = async (title: string, message: string, data?: any): Promise<boolean> => {
  try {
    const response = await fetch('/api/notifications/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: message,
        data,
        tag: `trading-signal-${Date.now()}`
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Web Push send failed:', error);
    return false;
  }
};

// Test function to verify push notifications work
export const testWebPush = async (): Promise<boolean> => {
  try {
    // First ensure we're subscribed
    const subscribed = await subscribeToWebPush();
    if (!subscribed) {
      console.log('❌ Failed to subscribe to Web Push');
      return false;
    }

    // Send test notification
    const sent = await sendWebPushNotification(
      '🧪 Trading Signals Test',
      'This is a test notification to verify Web Push works on your device!',
      { test: true, timestamp: Date.now() }
    );

    if (sent) {
      console.log('✅ Test Web Push notification sent');
      return true;
    } else {
      console.log('❌ Failed to send test notification');
      return false;
    }
  } catch (error) {
    console.error('Web Push test failed:', error);
    return false;
  }
};