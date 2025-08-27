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
        
        // Mobile browser specific checks
        const isSafariIOS = /iPhone|iPad/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isMobile = isSafariIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log(`Device info - Mobile: ${isMobile}, Safari iOS: ${isSafariIOS}, Android: ${isAndroid}`);
        
        if (isSafariIOS) {
          console.log('⚠️ Safari iOS detected - Push notifications may have limitations');
        }
        
        // Check for HTTPS requirement
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        console.log(`Connection secure: ${isSecure} (protocol: ${window.location.protocol})`);
        
        if (!isSecure) {
          console.error('❌ Push notifications require HTTPS');
          resolve(false);
          return;
        }
        
        // Check if already subscribed (v16 API)
        let isSubscribed = false;
        let userId = null;
        
        try {
          // Method 1: Try the property access
          if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optedIn !== 'undefined') {
            isSubscribed = OneSignal.User.PushSubscription.optedIn;
          }
          // Method 2: Try async method if available
          else if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.getOptedInAsync === 'function') {
            isSubscribed = await OneSignal.User.PushSubscription.getOptedInAsync();
          }
          
          // Get user ID
          if (OneSignal.User && OneSignal.User.onesignalId) {
            userId = OneSignal.User.onesignalId;
          } else if (OneSignal.User && OneSignal.User.PushSubscription && OneSignal.User.PushSubscription.id) {
            userId = OneSignal.User.PushSubscription.id;
          }
        } catch (err) {
          console.warn('Error checking subscription status:', err);
        }
        
        console.log('Current subscription status:', isSubscribed);
        console.log('OneSignal User ID:', userId);
        
        if (isSubscribed && userId) {
          console.log('✅ Already subscribed to OneSignal');
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
        
        // Request browser permission first
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('❌ Browser permission denied');
            resolve(false);
            return;
          }
        }
        
        // OneSignal subscription attempt - v16 specific mobile-friendly approach
        try {
          console.log('Attempting OneSignal v16 subscription...');
          
          // Method 1: Try the v16 optIn method
          if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optIn === 'function') {
            console.log('Using OneSignal.User.PushSubscription.optIn()');
            await OneSignal.User.PushSubscription.optIn();
          } 
          // Method 2: Try slidedown prompt (mobile-friendly)
          else if (typeof OneSignal.showSlidedownPrompt === 'function') {
            console.log('Using OneSignal.showSlidedownPrompt()');
            await OneSignal.showSlidedownPrompt();
          }
          // Method 3: Try native prompt (works on mobile)
          else if (typeof OneSignal.showNativePrompt === 'function') {
            console.log('Using OneSignal.showNativePrompt()');
            await OneSignal.showNativePrompt();
          }
          // Method 4: Legacy registration method
          else if (typeof OneSignal.registerForPushNotifications === 'function') {
            console.log('Using OneSignal.registerForPushNotifications()');
            await OneSignal.registerForPushNotifications();
          }
          // Method 5: Direct service worker registration (last resort)
          else if (typeof OneSignal.requestPermission === 'function') {
            console.log('Using OneSignal.requestPermission()');
            await OneSignal.requestPermission();
          }
          else {
            throw new Error('No compatible OneSignal subscription method found');
          }
        } catch (subscriptionError) {
          console.error('OneSignal subscription method failed:', subscriptionError);
          
          // Try one more fallback: direct browser notification request
          try {
            console.log('Trying direct browser notification as final fallback...');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              throw new Error('Browser permission not granted');
            }
            // If browser permission was granted, consider it a partial success
            console.log('Browser permission granted, but OneSignal subscription may have failed');
          } catch (browserError) {
            console.error('Browser fallback also failed:', browserError);
            resolve(false);
            return;
          }
        }
        
        // Wait longer on mobile devices for OneSignal to process
        const waitTime = isMobile ? 3000 : 2000; // 3 seconds for mobile, 2 for desktop
        console.log(`Waiting ${waitTime}ms for OneSignal processing (mobile: ${isMobile})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Check if subscription was successful
        let finalSubscribed = false;
        let finalUserId = null;
        
        try {
          if (OneSignal.User && OneSignal.User.PushSubscription) {
            if (typeof OneSignal.User.PushSubscription.optedIn !== 'undefined') {
              finalSubscribed = OneSignal.User.PushSubscription.optedIn;
            } else if (typeof OneSignal.User.PushSubscription.getOptedInAsync === 'function') {
              finalSubscribed = await OneSignal.User.PushSubscription.getOptedInAsync();
            }
          }
          
          // Get final user ID
          if (OneSignal.User && OneSignal.User.onesignalId) {
            finalUserId = OneSignal.User.onesignalId;
          } else if (OneSignal.User && OneSignal.User.PushSubscription && OneSignal.User.PushSubscription.id) {
            finalUserId = OneSignal.User.PushSubscription.id;
          }
        } catch (err) {
          console.warn('Error checking final subscription status:', err);
        }
        
        console.log('Final subscription status:', finalSubscribed);
        console.log('Final OneSignal User ID:', finalUserId);
        
        // More lenient success criteria for mobile devices
        const browserPermissionGranted = Notification.permission === 'granted';
        const hasOneSignalData = finalSubscribed || !!finalUserId;
        
        // On mobile, if browser permission is granted but OneSignal subscription failed,
        // we still consider it partially successful as notifications may still work
        const success = hasOneSignalData || (isMobile && browserPermissionGranted);
        
        if (success) {
          if (hasOneSignalData) {
            console.log('✅ OneSignal subscription fully successful!');
          } else if (isMobile && browserPermissionGranted) {
            console.log('⚠️ Partial success: Browser permission granted on mobile device');
          }
        } else {
          console.log('❌ OneSignal subscription failed');
        }
        
        resolve(success);
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