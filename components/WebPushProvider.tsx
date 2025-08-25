"use client";

import { useEffect } from 'react';

const WebPushProvider = () => {
  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window === 'undefined') return;

    // Initialize Web Push when component mounts
    const initPush = async () => {
      try {
        const { initWebPush } = await import('../utils/webPush');
        const initialized = await initWebPush();
        if (initialized) {
          console.log('✅ Web Push initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Web Push:', error);
      }
    };

    initPush();
  }, []);

  return null; // This component doesn't render anything
};

export default WebPushProvider;