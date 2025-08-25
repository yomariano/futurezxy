"use client";

import { useEffect, useState, useCallback } from 'react';

export const useOneSignal = () => {
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const subscribeToNotifications = useCallback(async (): Promise<boolean> => {
    if (!isClient || typeof window === 'undefined') return false;
    
    // Dynamically import to avoid SSR issues
    try {
      const { subscribeToNotifications: subscribe } = await import('../utils/onesignal');
      const result = await subscribe();
      return Boolean(result);
    } catch (error) {
      console.error('Failed to load OneSignal subscription:', error);
      return false;
    }
  }, [isClient]);

  const sendNotification = useCallback(async (title: string, message: string, data?: any): Promise<boolean> => {
    if (!isClient || typeof window === 'undefined') return false;
    
    try {
      const { sendNotification: send } = await import('../utils/onesignal');
      const result = await send(title, message, data);
      return Boolean(result);
    } catch (error) {
      console.error('Failed to load OneSignal send:', error);
      return false;
    }
  }, [isClient]);

  return {
    isClient,
    isInitialized,
    subscribeToNotifications,
    sendNotification
  };
};