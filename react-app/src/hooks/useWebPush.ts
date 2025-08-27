import { useEffect, useState, useCallback } from 'react';

export const useWebPush = () => {
  const [isClient, setIsClient] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsSupported(
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator && 
      'PushManager' in window
    );
  }, []);

  const subscribeToWebPush = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) return false;
    
    try {
      const { subscribeToWebPush: subscribe } = await import('../utils/webPush');
      return await subscribe();
    } catch (error) {
      console.error('Failed to subscribe to Web Push:', error);
      return false;
    }
  }, [isClient, isSupported]);

  const sendWebPushNotification = useCallback(async (
    title: string, 
    message: string, 
    data?: any
  ): Promise<boolean> => {
    if (!isClient || !isSupported) return false;
    
    try {
      const { sendWebPushNotification: send } = await import('../utils/webPush');
      return await send(title, message, data);
    } catch (error) {
      console.error('Failed to send Web Push notification:', error);
      return false;
    }
  }, [isClient, isSupported]);

  const testWebPush = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) return false;
    
    try {
      const { testWebPush: test } = await import('../utils/webPush');
      return await test();
    } catch (error) {
      console.error('Web Push test failed:', error);
      return false;
    }
  }, [isClient, isSupported]);

  return {
    isClient,
    isSupported,
    subscribeToWebPush,
    sendWebPushNotification,
    testWebPush
  };
};