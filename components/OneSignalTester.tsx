"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Send, TestTube, Check, X, Loader2 } from "lucide-react";
import { subscribeToNotifications, sendNotification } from "@/utils/onesignal";

interface OneSignalTesterProps {
  className?: string;
}

export function OneSignalTester({ className }: OneSignalTesterProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  
  // Custom message inputs
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [subscriptionController, setSubscriptionController] = useState<AbortController | null>(null);

  useEffect(() => {
    checkPermissionStatus();
    checkOneSignalStatus();
  }, []);

  const checkPermissionStatus = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  };

  const checkOneSignalStatus = async () => {
    try {
      if (typeof window === "undefined") return;
      
      // Wait for OneSignal to be ready
      const checkReady = () => {
        if (window.OneSignal) {
          setIsOneSignalReady(true);
          
          // Check subscription status using OneSignal v16 API
          try {
            if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
              // Check if optedIn is a property (v16 API)
              if (typeof window.OneSignal.User.PushSubscription.optedIn !== 'undefined') {
                setIsSubscribed(window.OneSignal.User.PushSubscription.optedIn);
              } else if (typeof window.OneSignal.User.PushSubscription.getOptedInAsync === 'function') {
                // Fallback to async method if available
                window.OneSignal.User.PushSubscription.getOptedInAsync().then((subscribed: boolean) => {
                  setIsSubscribed(subscribed);
                }).catch((err: any) => {
                  console.log("Could not check OneSignal subscription status:", err);
                });
              }
            }
          } catch (err) {
            console.log("Could not check OneSignal subscription status:", err);
          }
        } else {
          // Check again in 100ms
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    } catch (err) {
      console.error("Error checking OneSignal status:", err);
    }
  };

  const handleSubscribe = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Starting subscription process...');
      setLoadingStep('Initializing OneSignal...');
      
      // Create an abort controller for manual cancellation
      const controller = new AbortController();
      setSubscriptionController(controller);
      
      // Add a timeout wrapper around the subscription
      const subscriptionPromise = subscribeToNotifications();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Subscription process timed out after 35 seconds'));
        }, 35000);
      });
      
      const abortPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Subscription cancelled by user'));
        });
      });

      const result = await Promise.race([subscriptionPromise, timeoutPromise, abortPromise]);
      
      if (result) {
        setIsSubscribed(true);
        setSuccess("✅ Successfully subscribed to OneSignal notifications!");
        checkPermissionStatus();
      } else {
        throw new Error("Failed to subscribe to notifications");
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Failed to enable notifications";
      
      // Check for stored mobile-specific error information
      const lastError = (window as any).__lastNotificationError;
      if (lastError) {
        errorMessage = `${lastError.error}${lastError.suggestion ? `. ${lastError.suggestion}` : ''}`;
      }
      
      // Make error messages more user-friendly
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('permission denied')) {
        errorMessage = "Notifications blocked. Please check your browser settings and allow notifications for this site.";
      } else if (errorMessage.includes('NotSupportedError')) {
        errorMessage = "Your browser or device doesn't support push notifications.";
      } else if (errorMessage.includes('Network')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      
      setError(errorMessage);
      console.error("Error subscribing to OneSignal:", err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
      setSubscriptionController(null);
    }
  };

  const handleSendCustomNotification = async () => {
    if (!customTitle && !customMessage) {
      setError("Please enter either a title or message");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const title = customTitle || "💬 Custom Message";
      const message = customMessage || "Custom notification from signalstrading.app";
      
      const result = await sendNotification(title, message, {
        type: "custom",
        timestamp: Date.now(),
        source: "manual"
      });

      if (result) {
        setSuccess(`✅ Custom notification sent: "${title}"`);
        // Clear inputs after successful send
        setCustomTitle("");
        setCustomMessage("");
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send notification";
      setError(errorMessage);
      console.error("Error sending custom notification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const testMessages = [
        {
          title: "🟢 WaveTrend Green Signal",
          message: "BTCUSDT (1h) WaveTrend turned GREEN! WT1: 15.42, WT2: 12.38 at $47,250. Bullish momentum detected!"
        },
        {
          title: "🚀 Bullish Divergence Alert",
          message: "ETHUSDT (4h) showing bullish RSI divergence at $3,245. Potential uptrend incoming!"
        },
        {
          title: "💎 Extreme Oversold Alert",
          message: "ADAUSDT (15m) RSI at 18% - Extremely oversold! Price: $0.485"
        }
      ];

      const randomTest = testMessages[Math.floor(Math.random() * testMessages.length)];
      
      const result = await sendNotification(randomTest.title, randomTest.message, {
        type: "test",
        timestamp: Date.now(),
        source: "test-button"
      });

      if (result) {
        setSuccess(`✅ Test notification sent: "${randomTest.title}"`);
      } else {
        throw new Error("Failed to send test notification");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send test notification";
      setError(errorMessage);
      console.error("Error sending test notification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCancelSubscription = () => {
    if (subscriptionController) {
      subscriptionController.abort();
      setError('Subscription process was cancelled');
    }
  };

  const collectDebugInfo = () => {
    const info: any = {
      browser: navigator.userAgent,
      permission: Notification.permission,
      isHTTPS: window.location.protocol === 'https:',
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      oneSignalReady: isOneSignalReady,
      oneSignalExists: !!window.OneSignal,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushSupport: 'PushManager' in window,
      notificationSupport: 'Notification' in window,
      timestamp: new Date().toISOString()
    };

    // Add iOS version detection
    const iosMatch = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      info.iosVersion = `${iosMatch[1]}.${iosMatch[2]}`;
    }

    // Add Chrome version detection
    const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      info.chromeVersion = chromeMatch[1];
    }

    // Add last error information if available
    if ((window as any).__lastNotificationError) {
      info.lastError = (window as any).__lastNotificationError;
    }

    if (window.OneSignal && window.OneSignal.User) {
      info.oneSignal = {
        hasUser: !!window.OneSignal.User,
        hasPushSubscription: !!window.OneSignal.User.PushSubscription,
        optedIn: window.OneSignal.User.PushSubscription?.optedIn,
        userId: window.OneSignal.User.onesignalId || 'Not available'
      };
    }

    setDebugInfo(info);
    setShowDebug(true);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isSubscribed ? (
              <Bell className="h-6 w-6 text-green-500" />
            ) : (
              <BellOff className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                OneSignal Push Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isSubscribed
                  ? "Ready to receive trading alerts and custom messages"
                  : "Enable OneSignal notifications for instant alerts"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {permission === "granted" && <Check className="h-5 w-5 text-green-500" />}
            {permission === "denied" && <X className="h-5 w-5 text-red-500" />}
            {isOneSignalReady && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex justify-between items-center">
            <span>{success}</span>
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Subscription Section */}
        {!isSubscribed ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading || permission === "denied" || !isOneSignalReady}
                className="flex-1 sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingStep || 'Subscribing...'}
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Subscribe to OneSignal
                  </>
                )}
              </Button>

              {isLoading && subscriptionController && (
                <Button
                  onClick={handleCancelSubscription}
                  variant="outline"
                  size="sm"
                  className="sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            {permission === "denied" && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                ⚠️ Notifications are blocked in your browser. Please enable them in browser settings and refresh the page.
              </div>
            )}

            {!isOneSignalReady && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                🔄 Loading OneSignal SDK...
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Custom Message Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                💬 Send Custom Message
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customTitle" className="text-sm font-medium">
                    Title (optional)
                  </Label>
                  <Input
                    id="customTitle"
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Custom notification title..."
                    maxLength={100}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customTitle.length}/100 characters
                    {customTitle ? ' - Will show as title' : ' - Leave empty for default title'}
                  </div>
                </div>

                <div>
                  <Label htmlFor="customMessage" className="text-sm font-medium">
                    Message
                  </Label>
                  <Input
                    id="customMessage"
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your custom message here..."
                    maxLength={200}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customMessage.length}/200 characters
                    {customMessage ? ' - Your custom alert' : ' - Enter your message'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSendCustomNotification}
                  disabled={isLoading || (!customTitle && !customMessage)}
                  variant="default"
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Custom Message
                </Button>

                <Button
                  onClick={handleSendTestNotification}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Send Test Alert
                </Button>
              </div>
            </div>

            {/* Debug Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  🔧 Mobile Debug Tools
                </h4>
                <Button
                  onClick={collectDebugInfo}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Collect Debug Info
                </Button>
              </div>

              {showDebug && debugInfo && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Debug Information</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(debugInfo, null, 2))}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
              <p className="font-medium mb-1">💡 How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Custom messages appear instantly on your subscribed devices</li>
                <li>• Test alerts show realistic trading signal examples</li>
                <li>• The trading bot will also send automatic signals when detected</li>
                <li>• Works on mobile phones, tablets, and desktop computers</li>
                <li>• Use Debug Tools to diagnose mobile subscription issues</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default OneSignalTester;