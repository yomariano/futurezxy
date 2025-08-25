declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export const initOneSignal = () => {
  if (typeof window === 'undefined') return;
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: "f88d5ae4-e766-461f-bf00-90707c1b850e",
      safari_web_id: "web.onesignal.auto.2e77cfdc-f6e8-4572-82d4-363b6713f2bc",
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: {
        enable: false, // We'll handle subscription manually
      },
      allowLocalhostAsSecureOrigin: true,
    });
    
    // Store OneSignal instance globally
    window.OneSignal = OneSignal;
  });
};

export const subscribeToNotifications = async () => {
  if (typeof window === 'undefined') return false;
  
  // Wait for OneSignal to be ready
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        console.log('🔔 Checking OneSignal subscription status...');
        
        // Check if already subscribed
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        console.log('Current subscription status:', isSubscribed);
        
        if (isSubscribed) {
          console.log('✅ Already subscribed to OneSignal');
          const userId = await OneSignal.User.onesignalId;
          console.log('OneSignal User ID:', userId);
          resolve(true);
          return;
        }

        // Check browser permission first
        console.log('Browser notification permission:', Notification.permission);
        
        if (Notification.permission === 'denied') {
          console.log('❌ Browser notifications are denied');
          resolve(false);
          return;
        }

        // Try to opt in the user (this will prompt for permission)
        console.log('🔔 Prompting user for OneSignal subscription...');
        await OneSignal.User.PushSubscription.optIn();
        
        // Check if subscription was successful
        const finalSubscribed = await OneSignal.User.PushSubscription.optedIn;
        const userId = await OneSignal.User.onesignalId;
        
        console.log('Final subscription status:', finalSubscribed);
        console.log('OneSignal User ID:', userId);
        
        resolve(finalSubscribed);
      } catch (error) {
        console.error('OneSignal subscription error:', error);
        resolve(false);
      }
    });
  });
};

export const sendNotification = async (title: string, message: string, data?: any) => {
  try {
    // Send to OneSignal REST API without requiring client-side player ID
    const response = await fetch('/api/notifications/onesignal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        data
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('OneSignal send error:', error);
    return false;
  }
};