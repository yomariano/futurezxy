"use client";

import { useEffect } from 'react';

const OneSignalProvider = () => {
  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window === 'undefined') return;

    // Add OneSignal script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => {
      // Initialize OneSignal after script loads
      import('../utils/onesignal').then(({ initOneSignal }) => {
        initOneSignal();
      });
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src*="OneSignalSDK.page.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default OneSignalProvider;