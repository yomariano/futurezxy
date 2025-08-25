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
    console.log('🔔 Starting Web Push subscription process...');
    
    // Check VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log('VAPID key available:', !!vapidKey);
    console.log('VAPID key (first 20 chars):', vapidKey?.substring(0, 20));
    
    if (!vapidKey) {
      console.error('❌ VAPID public key not found');
      return false;
    }
    
    // Request notification permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return false;
    }

    // Get service worker registration
    console.log('Getting service worker registration...');
    const registration = window.webPushRegistration || await navigator.serviceWorker.ready;
    console.log('Service worker registration:', registration);
    
    // Check if already subscribed
    console.log('Checking existing subscription...');
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('Creating new push subscription...');
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      
      console.log('✅ New push subscription created:', subscription);
    } else {
      console.log('✅ Using existing push subscription:', subscription);
    }

    // Send subscription to server
    console.log('Sending subscription to server...');
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      }),
    });

    console.log('Server response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Web Push subscription successful');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to save subscription:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Web Push subscription failed:', error);
    return false;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
    console.log('🧪 Starting Web Push test...');
    
    // First ensure we're subscribed
    console.log('Step 1: Ensuring subscription...');
    const subscribed = await subscribeToWebPush();
    if (!subscribed) {
      console.log('❌ Failed to subscribe to Web Push');
      return false;
    }
    console.log('✅ Subscription confirmed');

    // Send test notification
    console.log('Step 2: Sending test notification...');
    const sent = await sendWebPushNotification(
      '🧪 Trading Signals Test',
      'This is a test notification to verify Web Push works on your device!',
      { test: true, timestamp: Date.now() }
    );

    if (sent) {
      console.log('✅ Test Web Push notification sent successfully');
      console.log('📱 Check your device for the notification!');
      return true;
    } else {
      console.log('❌ Failed to send test notification');
      return false;
    }
  } catch (error) {
    console.error('❌ Web Push test failed:', error);
    return false;
  }
};