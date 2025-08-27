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
    // Add overall timeout to prevent hanging
    const overallTimeout = setTimeout(() => {
      console.error('⏰ Subscription process timed out after 30 seconds');
      (window as any).__lastNotificationError = {
        error: 'Subscription timed out',
        suggestion: 'The subscription process took too long. Try refreshing the page and trying again.',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      resolve(false);
    }, 30000); // 30 second timeout

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
          // Check iOS version for compatibility
          const iosVersion = navigator.userAgent.match(/OS (\d+)_(\d+)/);
          if (iosVersion) {
            const majorVersion = parseInt(iosVersion[1]);
            console.log(`iOS version: ${majorVersion}.${iosVersion[2]}`);
            if (majorVersion < 16) {
              console.warn('⚠️ iOS version may not support web push notifications');
            }
          }
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
          console.log('Requesting browser notification permission...');
          
          // Add mobile-specific delay before permission request
          if (isMobile) {
            console.log('Mobile device detected, waiting 500ms before permission request...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Add timeout for permission request to prevent hanging
          console.log('Requesting notification permission...');
          const permission = await Promise.race([
            Notification.requestPermission(),
            new Promise<NotificationPermission>((_, reject) => 
              setTimeout(() => reject(new Error('Permission request timed out')), 10000)
            )
          ]);
          console.log('Browser permission result:', permission);
          
          if (permission !== 'granted') {
            console.log('❌ Browser permission denied');
            
            // Store specific error for mobile users
            if (isMobile) {
              (window as any).__lastNotificationError = {
                error: 'Browser permission denied',
                device: isSafariIOS ? 'Safari iOS' : isAndroid ? 'Android' : 'Mobile',
                suggestion: isSafariIOS ? 
                  'On Safari iOS: Go to Settings > Safari > Website Settings > Notifications, then allow for this site' :
                  'Check your browser notification settings and ensure notifications are allowed',
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              };
            }
            
            resolve(false);
            return;
          }
        }
        
        // OneSignal subscription attempt - v16 specific mobile-friendly approach
        try {
          console.log('Attempting OneSignal v16 subscription...');
          
          // Special handling for Safari iOS
          if (isSafariIOS) {
            console.log('Applying Safari iOS specific workarounds...');
            
            // iOS Safari requires a longer delay and specific method order
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to use the most compatible method for iOS with timeout
            if (typeof OneSignal.showNativePrompt === 'function') {
              console.log('Using OneSignal.showNativePrompt() for iOS Safari');
              await Promise.race([
                OneSignal.showNativePrompt(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('iOS native prompt timed out')), 15000)
                )
              ]);
            } else if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optIn === 'function') {
              console.log('Using OneSignal.User.PushSubscription.optIn() for iOS Safari');
              await Promise.race([
                OneSignal.User.PushSubscription.optIn(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('iOS optIn timed out')), 15000)
                )
              ]);
            } else {
              throw new Error('No iOS Safari compatible method found');
            }
          }
          // Method 1: Try the v16 optIn method (for non-iOS)
          else if (OneSignal.User && OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optIn === 'function') {
            console.log('Using OneSignal.User.PushSubscription.optIn()');
            await Promise.race([
              OneSignal.User.PushSubscription.optIn(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('optIn method timed out')), 15000)
              )
            ]);
          } 
          // Method 2: Try slidedown prompt (mobile-friendly)
          else if (typeof OneSignal.showSlidedownPrompt === 'function') {
            console.log('Using OneSignal.showSlidedownPrompt()');
            await Promise.race([
              OneSignal.showSlidedownPrompt(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('slidedown prompt timed out')), 15000)
              )
            ]);
          }
          // Method 3: Try native prompt (works on mobile)
          else if (typeof OneSignal.showNativePrompt === 'function') {
            console.log('Using OneSignal.showNativePrompt()');
            await Promise.race([
              OneSignal.showNativePrompt(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('native prompt timed out')), 15000)
              )
            ]);
          }
          // Method 4: Legacy registration method
          else if (typeof OneSignal.registerForPushNotifications === 'function') {
            console.log('Using OneSignal.registerForPushNotifications()');
            await Promise.race([
              OneSignal.registerForPushNotifications(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('registerForPushNotifications timed out')), 15000)
              )
            ]);
          }
          // Method 5: Direct service worker registration (last resort)
          else if (typeof OneSignal.requestPermission === 'function') {
            console.log('Using OneSignal.requestPermission()');
            await Promise.race([
              OneSignal.requestPermission(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('requestPermission timed out')), 15000)
              )
            ]);
          }
          else {
            throw new Error('No compatible OneSignal subscription method found');
          }
        } catch (subscriptionError) {
          console.error('OneSignal subscription method failed:', subscriptionError);
          
          // Provide specific error information
          let errorMessage = 'Unknown subscription error';
          if (subscriptionError instanceof Error) {
            errorMessage = subscriptionError.message;
            
            // Handle common mobile errors
            if (errorMessage.includes('NotAllowedError')) {
              errorMessage = 'Notifications blocked by user or browser policy';
            } else if (errorMessage.includes('NotSupportedError')) {
              errorMessage = 'Push notifications not supported on this device/browser';
            } else if (errorMessage.includes('AbortError')) {
              errorMessage = 'Subscription process was cancelled';
            } else if (errorMessage.includes('Network')) {
              errorMessage = 'Network error during subscription';
            }
          }
          
          console.error(`Subscription failed: ${errorMessage}`);
          
          // Try one more fallback: direct browser notification request
          try {
            console.log('Trying direct browser notification as final fallback...');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              throw new Error(`Browser permission not granted. Original error: ${errorMessage}`);
            }
            // If browser permission was granted, consider it a partial success
            console.log('Browser permission granted, but OneSignal subscription may have failed');
          } catch (browserError) {
            console.error('Browser fallback also failed:', browserError);
            // Store the error for debugging
            (window as any).__lastNotificationError = {
              oneSignalError: errorMessage,
              browserError: browserError instanceof Error ? browserError.message : 'Unknown browser error',
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            };
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
        
        // Clear the timeout since we completed successfully
        clearTimeout(overallTimeout);
        resolve(success);
      } catch (error) {
        console.error('OneSignal subscription error:', error);
        // Clear the timeout since we completed (even with error)
        clearTimeout(overallTimeout);
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