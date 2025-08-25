"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useOneSignal } from "@/hooks/useOneSignal";
import { useWebPush } from "@/hooks/useWebPush";
import {
  Activity,
  Waves,
  LineChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Bell,
  Pin,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

// Update the signal types to include extreme states
type SignalType =
  | "buy"
  | "sell"
  | "neutral"
  | "near-buy"
  | "near-sell"
  | "extreme-buy"
  | "extreme-sell";

// Update the color function
const getSignalColor = (signal: SignalType, settings: WaveTrendSettings) => {
  switch (signal) {
    case "extreme-buy":
      return "text-green-600 dark:text-green-500";
    case "buy":
      return "text-green-500 dark:text-green-400";
    case "near-buy":
      return "text-emerald-500 dark:text-emerald-400";
    case "extreme-sell":
      return "text-red-600 dark:text-red-500";
    case "sell":
      return "text-red-500 dark:text-red-400";
    case "near-sell":
      return "text-rose-500 dark:text-rose-400";
    default:
      return "text-blue-500 dark:text-blue-400";
  }
};

// Add this new interface near other interfaces
interface ColorChangeTimestamp {
  timestamp: number;
  color: "red" | "green";
}

// Add new interface for the WebSocket message
interface WaveTrendMessage {
  type: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  wt1: number;
  wt2: number;
  rsi: number;
  sma50: number;
  sma200: number;
}

interface TradingPair {
  symbol: string;
  price?: number;
  alerts?: boolean;
  pinned?: boolean;
  signals: Record<Timeframe, SignalType>;
  indicators: Record<
    Timeframe,
    {
      wt1: number;
      wt2: number;
      sma50: number;
      sma200: number;
      rsi: number;
      colorChanges?: {
        wt1?: ColorChangeTimestamp;
        wt2?: ColorChangeTimestamp;
      };
      signals?: {
        bearish_divergence: boolean;
        bullish_divergence: boolean;
        hidden_bearish_divergence: boolean;
        hidden_bullish_divergence: boolean;
        overbought: boolean;
        oversold: boolean;
        price_above_sma50: boolean;
        price_above_sma200: boolean;
        sma50_above_sma200: boolean;
      };
    }
  >;
  order?: number;
}

// Modify calculateSignal to accept settings as a parameter
const calculateSignal = (
  wt: number,
  settings: WaveTrendSettings
): SignalType => {
  const TRANSITION_PERCENTAGE = 0.05;

  const buyTransitionZone =
    settings.buyThreshold +
    Math.abs(settings.buyThreshold) * TRANSITION_PERCENTAGE;
  const sellTransitionZone =
    settings.sellThreshold - settings.sellThreshold * TRANSITION_PERCENTAGE;

  if (wt <= settings.extremeBuyThreshold) {
    return "extreme-buy";
  }
  if (wt >= settings.extremeSellThreshold) {
    return "extreme-sell";
  }
  if (wt <= settings.buyThreshold) {
    return "buy";
  }
  if (wt <= buyTransitionZone) {
    return "near-buy";
  }
  if (wt >= settings.sellThreshold) {
    return "sell";
  }
  if (wt >= sellTransitionZone) {
    return "near-sell";
  }
  return "neutral";
};

// Add this helper function at the top of the file, with the other utility functions
const timeframeOrder: Record<string, number> = {
  "1m": 1,
  "5m": 2,
  "15m": 3,
  "30m": 4,
  "1h": 5,
  "4h": 6,
  "1d": 7,
  "1w": 8,
};

// Add this helper function at the top of the file
const timeframeToMinutes = (timeframe: string): number => {
  const value = parseInt(timeframe);
  const unit = timeframe.slice(-1);

  switch (unit) {
    case "m":
      return value;
    case "h":
      return value * 60;
    case "d":
      return value * 60 * 24;
    case "w":
      return value * 60 * 24 * 7;
    default:
      return 0;
  }
};

interface IndicatorMessage {
  type: "indicators";
  symbol: string;
  timeframe: string;
  timestamp: string;
  price: number;
  rsi: number;
  wt1: number;
  wt2: number;
  sma50?: number; // Optional since Node.js API doesn't provide these yet
  sma200?: number; // Optional since Node.js API doesn't provide these yet
  rsi_divergences: {
    bullish: boolean;
    bearish: boolean;
  };
  signals?: {
    bearish_divergence: boolean;
    bullish_divergence: boolean;
    cross_over: boolean;
    cross_under: boolean;
    hidden_bearish_divergence: boolean;
    hidden_bullish_divergence: boolean;
    overbought: boolean;
    oversold: boolean;
    price_above_sma50: boolean;
    price_above_sma200: boolean;
    sma50_above_sma200: boolean;
  };
}

// Add this CSS animation at the top of your file or in your global CSS
const blinkingAnimation = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

interface CrossSignals {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  type: "cross_over" | "cross_under";
}

// Add with other utility functions
const countBuySignals = (pair: TradingPair): number => {
  return Object.values(pair.signals).reduce((count, signal) => {
    if (signal === "extreme-buy" || signal === "buy" || signal === "near-buy") {
      return count + 1;
    }
    return count;
  }, 0);
};

// Add these constants right after the imports and before any type definitions
const EXTREME_THRESHOLD = 80; // For WaveTrend extreme signals
const RSI_OVERBOUGHT = 70; // For RSI overbought
const RSI_OVERSOLD = 30; // For RSI oversold

// Add this near the top of the file after imports
const NOTIFICATION_SETTINGS_KEY = "pairNotificationSettings";

// Add this interface with the other interfaces
interface NotificationSettings {
  [symbol: string]: boolean;
}

// Replace the audio file constant and add this utility function
const createBellSound = () => {
  if (typeof window === 'undefined') return null; // SSR guard
  
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    return () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Bell-like sound settings
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // Higher frequency for bell sound

      // Volume envelope
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
  } catch (error) {
    console.error('Failed to create bell sound:', error);
    return null;
  }
};

// Add these constants at the top of the file
const SETTINGS_KEY = "waveTrendSettings";
const DEFAULT_SETTINGS = {
  buyThreshold: -53,
  sellThreshold: 53,
  extremeBuyThreshold: -80,
  extremeSellThreshold: 80,
};

// Add this interface with other interfaces
interface WaveTrendSettings {
  buyThreshold: number;
  sellThreshold: number;
  extremeBuyThreshold: number;
  extremeSellThreshold: number;
}

// Add this constant with other constants
const PINNED_PAIRS_KEY = "pinnedPairs";

// Global audio context for better mobile compatibility
let audioContext: AudioContext | null = null;

// Initialize audio context on user interaction
const initAudioContext = () => {
  if (typeof window === 'undefined') return; // SSR guard
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("🎵 Audio context initialized");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }
  
  // Resume audio context if it's suspended (required for mobile)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log("🎵 Audio context resumed");
    });
  }
};

// Add this near your other utility functions
const playNotificationSound = async () => {
  if (typeof window === 'undefined') return; // SSR guard
  
  try {
    // Ensure audio context is ready
    initAudioContext();
    
    if (!audioContext || audioContext.state !== 'running') {
      console.warn("Audio context not ready, trying alternative methods");
      // Try HTML5 Audio as fallback
      try {
        // Create a data URL for a simple beep sound
        const beepSound = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBT2X2u/Ecs" +
          "0EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFApGn+DyvmMcBT2X2u/Ec80EJHXF8N2QQQoUXrTp66hVFA==");
        beepSound.volume = 0.3;
        await beepSound.play();
        console.log("🔊 Fallback beep sound played");
        return;
      } catch (e) {
        console.warn("HTML5 Audio also failed:", e);
      }
    }

    if (audioContext && audioContext.state === 'running') {
      // Create a pleasant two-tone notification sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect the nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the sound - pleasant notification tones
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(880, audioContext.currentTime); // A note
      
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(1174.66, audioContext.currentTime); // D note (perfect fourth)
      
      // Volume envelope for a pleasant sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      // Play the sound
      const now = audioContext.currentTime;
      oscillator1.start(now);
      oscillator2.start(now + 0.1); // Slight delay for harmony
      
      oscillator1.stop(now + 0.6);
      oscillator2.stop(now + 0.8);
      
      console.log("🔊 Web Audio notification sound played");
    }
  } catch (error) {
    console.error("Error playing notification sound:", error);
    console.log("🔕 Using silent notification");
  }
};

const showNotification = (symbol: string, message: string, signalType: 'buy' | 'sell' | 'info' = 'info') => {
  if (typeof window === 'undefined') return; // SSR guard
  
  console.log("Attempting to show notification:", { symbol, message, signalType });

  const notificationSettings = JSON.parse(
    localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || "{}"
  );
  
  // Always play sound and log if alerts are enabled
  if (notificationSettings[symbol]) {
    playNotificationSound();
    console.log(`🔔 ${symbol} Alert: ${message}`);
  }

  // Try browser notifications as additional layer
  if ("Notification" in window) {
    console.log("Notification permission:", Notification.permission);

    if (Notification.permission === "granted" && notificationSettings[symbol]) {
      try {
        const notification = new Notification(`${symbol} Trading Alert 📈`, {
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `trading-${symbol}`,
          requireInteraction: true,
          silent: false,
        });

        notification.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          notification.close();
        };

        // Force show notification even if it might fail
        setTimeout(() => {
          if (notification) {
            console.log("✅ Browser notification attempted");
          }
        }, 100);

        console.log("✅ Browser notification created");
      } catch (error) {
        console.warn("Browser notification failed, in-app notification shown instead:", error);
      }
    } else if (Notification.permission === "default") {
      console.log("Requesting notification permission...");
      Notification.requestPermission().then((permission) => {
        console.log("Permission result:", permission);
        if (permission === "granted") {
          showNotification(symbol, message, signalType);
        }
      });
    }
  }
};

// Placeholder for createInAppNotification - will be defined inside component

// Get current push subscription
const getSubscription = async (): Promise<PushSubscription | null> => {
  if (typeof window === 'undefined') return null; // SSR guard
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error getting subscription:", error);
    return null;
  }
};

// VAPID push notification subscription
const subscribeToPushNotifications = async (registration: ServiceWorkerRegistration) => {
  if (typeof window === 'undefined') return; // SSR guard
  
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc';
    
    if (!vapidPublicKey) {
      console.warn("VAPID public key not found");
      return;
    }

    console.log("Subscribing to push notifications with VAPID key...");

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

    console.log("Push subscription:", subscription);

    // Send subscription to server
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId: 'trading-user', // In production, use actual user ID
        symbols: [], // Subscribe to all pairs - will be updated later
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Push subscription saved successfully");
      console.log("🔔 VAPID push notifications enabled");
    } else {
      console.error("Failed to save subscription:", result.error);
    }

  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
  }
};

// Update the testNotification function
const testNotification = (playBellSound?: () => void) => {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        // Create notification with supported options
        const notification = new Notification("Trading Alert 📈", {
          body: "This is a test trading notification",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "test-notification",
          requireInteraction: true, // Notification persists until user interacts
          silent: false, // Allow system sound
        });

        // Add click handler
        notification.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          notification.close();
        };

        // Play custom sound
        playBellSound?.();
      } catch (error) {
        console.error("Error sending test notification:", error);
      }
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          testNotification(playBellSound);
        }
      });
    } else {
      // If notifications are denied, show a message to the user
      alert(
        "Please enable notifications in your browser settings to receive trading alerts."
      );
    }
  }
};

const PairsTable = () => {
  const { isClient, subscribeToNotifications, sendNotification } = useOneSignal();
  const { 
    isSupported: isWebPushSupported, 
    subscribeToWebPush, 
    sendWebPushNotification,
    testWebPush 
  } = useWebPush();
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const connectionAttempted = useRef(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = useRef(5);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>(
    {}
  );
  const [timeframes, setTimeframes] = useState<Timeframe[]>([
    "1m", "5m", "15m", "30m", "1h", "4h", "1d"
  ]);
  const [crossSignals, setCrossSignals] = useState<CrossSignals[]>([]);
  const [sortByBuySignals, setSortByBuySignals] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({});
  const [playBell, setPlayBell] = useState<(() => void) | null>(null);
  const [settings, setSettings] = useState<WaveTrendSettings>(DEFAULT_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<string[]>([]);
  const [showNotificationConsole, setShowNotificationConsole] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState<Array<{
    id: string;
    symbol: string;
    message: string;
    timestamp: number;
    type: 'buy' | 'sell' | 'info';
  }>>([]);

  // Custom notification logging function that shows push notifications on screen
  const notificationLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = data 
      ? `[${timestamp}] ${message} ${JSON.stringify(data, null, 2)}`
      : `[${timestamp}] ${message}`;
    
    console.log('🔔 ' + message, data); // Log to console for debugging
    setNotificationLogs(prev => [...prev.slice(-19), logEntry]); // Keep last 20 logs
  }, []);

  // Listen for global push notification events
  useEffect(() => {
    const handlePushNotificationEvent = (event: CustomEvent) => {
      notificationLog(event.detail.message, event.detail.data);
    };

    window.addEventListener('pushNotificationSent', handlePushNotificationEvent as EventListener);
    
    // Add initial log
    notificationLog('🔔 Push notification console initialized');

    return () => {
      window.removeEventListener('pushNotificationSent', handlePushNotificationEvent as EventListener);
    };
  }, [notificationLog]);

  // Load saved order on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem("pairsOrder");
    if (savedOrder) {
      const orderMap = JSON.parse(savedOrder);
      setPairs((current) =>
        [...current].sort(
          (a, b) => (orderMap[a.symbol] || 0) - (orderMap[b.symbol] || 0)
        )
      );
    }
  }, []);

  // Add with other useEffects
  useEffect(() => {
    const savedSort = localStorage.getItem("sortByBuySignals");
    if (savedSort) {
      setSortByBuySignals(JSON.parse(savedSort));
    }
  }, []);

  // Replace the audio initialization effect with this
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize bell sound
    setPlayBell(() => createBellSound());

    // Load notification settings from localStorage
    const savedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Add this effect to load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Add useEffect to load pinned pairs on mount
  useEffect(() => {
    const savedPinnedPairs = localStorage.getItem(PINNED_PAIRS_KEY);
    if (savedPinnedPairs) {
      const pinnedPairsMap = JSON.parse(savedPinnedPairs);
      setPairs((current) =>
        current.map((pair) => ({
          ...pair,
          pinned: pinnedPairsMap[pair.symbol] || false,
        }))
      );
    }
  }, []);

  // Add this useEffect to request notification permission and initialize audio on component mount
  useEffect(() => {
    const initNotifications = async () => {
      // Only initialize on client side after SSR hydration
      if (!isClient) return;
      
      // Try to subscribe to OneSignal notifications
      try {
        const subscribed = await subscribeToNotifications();
        if (subscribed) {
          notificationLog("✅ OneSignal notifications enabled");
        } else {
          notificationLog("⚠️ OneSignal subscription pending user permission");
        }
      } catch (error) {
        console.error("OneSignal initialization error:", error);
        notificationLog("❌ OneSignal failed, using fallback notifications");
      }

      if ("Notification" in window && "serviceWorker" in navigator) {
        try {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);

          // Request permission
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            console.log("Notification permission status:", permission);
          }

          // Subscribe to push notifications if permission granted
          if (Notification.permission === "granted") {
            await subscribeToPushNotifications(registration);
          }

          console.log("Current notification permission:", Notification.permission);
        } catch (error) {
          console.error("Error initializing notifications:", error);
        }
      } else {
        console.log("Notifications or Service Worker not supported in this browser");
      }
    };

    initNotifications();

    // Initialize audio context on first user interaction
    const handleUserInteraction = () => {
      initAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isClient, notificationLog, subscribeToNotifications]);

  const handleIndicatorMessage = async (data: IndicatorMessage) => {
    const signal = calculateSignal(data.wt1, settings);

    // Update timeframes if we receive a new one (fallback for new timeframes)
    setTimeframes((current) => {
      if (!current.includes(data.timeframe as Timeframe)) {
        // Adding new timeframe
        return [...current, data.timeframe as Timeframe].sort(
          (a, b) => (timeframeOrder[a] || 999) - (timeframeOrder[b] || 999)
        );
      }
      return current;
    });

    setPairs((currentPairs) => {
      // Find existing pair
      const existingPair = currentPairs.find((p) => p.symbol === data.symbol);
      const previousSignal = existingPair?.signals[data.timeframe as Timeframe];

      // Check if this is a new buy signal (green signal)
      const isGreenSignal = signal === "buy" || signal === "extreme-buy" || signal === "near-buy";
      const wasGreenSignal = previousSignal === "buy" || previousSignal === "extreme-buy" || previousSignal === "near-buy";
      const isNewGreenSignal = isGreenSignal && !wasGreenSignal;

      // Calculate WT2 signal to check if either WT1 or WT2 turned green
      const wt2Signal = calculateSignal(data.wt2, settings);
      const isWt2GreenSignal = wt2Signal === "buy" || wt2Signal === "extreme-buy" || wt2Signal === "near-buy";
      
      // Get previous WT2 signal if available
      const previousWt2Signal = existingPair?.indicators[data.timeframe as Timeframe] 
        ? calculateSignal(existingPair.indicators[data.timeframe as Timeframe].wt2, settings)
        : null;
      const wasWt2GreenSignal = previousWt2Signal === "buy" || previousWt2Signal === "extreme-buy" || previousWt2Signal === "near-buy";
      const isNewWt2GreenSignal = isWt2GreenSignal && !wasWt2GreenSignal;

      // Store notification data for processing outside setPairs callback
      const shouldNotify = (
        (data.timeframe === "1m" || data.timeframe === "5m") &&
        (isNewGreenSignal || isNewWt2GreenSignal) &&
        notificationSettings[data.symbol]
      );

      if (shouldNotify) {
        const triggerType = isNewGreenSignal && isNewWt2GreenSignal 
          ? "Both WT1 & WT2" 
          : isNewGreenSignal 
            ? "WT1" 
            : "WT2";
        const signalToReport = isNewGreenSignal ? signal : wt2Signal;
        const notificationMessage = `🎯 ${triggerType} ${signalToReport.toUpperCase()} signal on ${data.timeframe} (WT1: ${data.wt1.toFixed(2)}, WT2: ${data.wt2.toFixed(2)})`;
        
        // Triggering notifications synchronously
        // Play sound notification
        playBell?.();
        
        // Show local notification
        showNotification(
          data.symbol,
          notificationMessage,
          'buy'
        );

        // Log push notification being sent
        notificationLog(`📤 Sending ${triggerType} push notification for ${data.symbol} (${data.timeframe})`, {
          signal: signalToReport,
          wt1: data.wt1.toFixed(2),
          wt2: data.wt2.toFixed(2),
          price: data.price
        });

        // Send notifications asynchronously without await in callback
        (async () => {
          try {
            const oneSignalSuccess = await sendNotification(
              `${data.symbol} - ${triggerType} Signal`,
              notificationMessage,
              {
                symbol: data.symbol,
                timeframe: data.timeframe,
                triggerType,
                signal: signalToReport,
                wt1: data.wt1,
                wt2: data.wt2,
                price: data.price,
                timestamp: Date.now()
              }
            );

            if (oneSignalSuccess) {
              notificationLog(`✅ OneSignal notification sent for ${data.symbol}`);
            } else {
              notificationLog(`⚠️ OneSignal failed, trying Web Push fallback for ${data.symbol}`);
              
              // Try Web Push API fallback first
              const webPushSuccess = await sendWebPushNotification(
                `${data.symbol} - ${triggerType} Signal`,
                notificationMessage,
                {
                  symbol: data.symbol,
                  timeframe: data.timeframe,
                  triggerType,
                  signal: signalToReport,
                  wt1: data.wt1,
                  wt2: data.wt2,
                  price: data.price,
                  timestamp: Date.now()
                }
              );

              if (webPushSuccess) {
                notificationLog(`✅ Web Push fallback sent for ${data.symbol}`);
              } else {
                notificationLog(`⚠️ Web Push failed, trying direct VAPID for ${data.symbol}`);
                
                // Final fallback to direct VAPID
                const response = await fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: `${data.symbol} - ${triggerType} Signal`,
                  body: notificationMessage,
                  tag: `wt-signal-${data.symbol}-${data.timeframe}`,
                  url: '/signals',
                  data: {
                    symbol: data.symbol,
                    timeframe: data.timeframe,
                    triggerType,
                    signal: signalToReport,
                    wt1: data.wt1,
                    wt2: data.wt2,
                    price: data.price,
                    timestamp: Date.now(),
                  },
                }),
              });

                if (response.ok) {
                  notificationLog(`✅ VAPID fallback sent for ${data.symbol}`);
                } else {
                  notificationLog(`❌ All notifications failed for ${data.symbol}`);
                }
              }
            }
          } catch (error: any) {
            console.error('Failed to send push notification:', error);
            notificationLog(`❌ All notifications failed for ${data.symbol}: ${error.message}`);
          }
        })();
      }

      // Update pair data
      if (existingPair) {
        return currentPairs.map((pair) =>
          pair.symbol === data.symbol
            ? {
                ...pair,
                price: data.price,
                signals: {
                  ...pair.signals,
                  [data.timeframe]: signal,
                },
                indicators: {
                  ...pair.indicators,
                  [data.timeframe]: {
                    wt1: data.wt1,
                    wt2: data.wt2,
                    rsi: data.rsi,
                    sma50: data.sma50 || data.price, // Use price as fallback for SMA50
                    sma200: data.sma200 || data.price, // Use price as fallback for SMA200
                    signals: data.signals || {
                      bearish_divergence:
                        data.rsi_divergences?.bearish || false,
                      bullish_divergence:
                        data.rsi_divergences?.bullish || false,
                      hidden_bearish_divergence: false,
                      hidden_bullish_divergence: false,
                      overbought: data.rsi > 70,
                      oversold: data.rsi < 30,
                      price_above_sma50:
                        data.price > (data.sma50 || data.price),
                      price_above_sma200:
                        data.price > (data.sma200 || data.price),
                      sma50_above_sma200:
                        (data.sma50 || data.price) >
                        (data.sma200 || data.price),
                    },
                  },
                },
              }
            : pair
        );
      } else {
        // Create new pair
        const newPair: TradingPair = {
          symbol: data.symbol,
          price: data.price,
          signals: { [data.timeframe]: signal } as Record<
            Timeframe,
            SignalType
          >,
          indicators: {
            [data.timeframe]: {
              wt1: data.wt1,
              wt2: data.wt2,
              rsi: data.rsi,
              sma50: data.sma50 || data.price,
              sma200: data.sma200 || data.price,
              signals: data.signals || {
                bearish_divergence: data.rsi_divergences?.bearish || false,
                bullish_divergence: data.rsi_divergences?.bullish || false,
                hidden_bearish_divergence: false,
                hidden_bullish_divergence: false,
                overbought: data.rsi > 70,
                oversold: data.rsi < 30,
                price_above_sma50: data.price > (data.sma50 || data.price),
                price_above_sma200: data.price > (data.sma200 || data.price),
                sma50_above_sma200:
                  (data.sma50 || data.price) > (data.sma200 || data.price),
              },
            },
          } as Record<
            Timeframe,
            {
              wt1: number;
              wt2: number;
              rsi: number;
              sma50: number;
              sma200: number;
              signals?: any;
            }
          >,
        };
        return [...currentPairs, newPair];
      }
    });

    // Add debug logging
    if (data.signals?.cross_over || data.signals?.cross_under) {
      console.log("Cross signal detected:", {
        symbol: data.symbol,
        timeframe: data.timeframe,
        crossOver: data.signals.cross_over,
        crossUnder: data.signals.cross_under,
      });
    }

    // Handle cross signals - check if signals object exists first
    if (data.signals?.cross_over || data.signals?.cross_under) {
      const newSignal: CrossSignals = {
        symbol: data.symbol,
        timeframe: data.timeframe as Timeframe,
        timestamp: Date.now(),
        type: data.signals.cross_over ? "cross_over" : "cross_under",
      };

      console.log("Adding new cross signal:", newSignal);

      setCrossSignals((prev) => {
        // Remove any existing signals for this symbol/timeframe combination
        const filtered = prev.filter(
          (s) => !(s.symbol === data.symbol && s.timeframe === data.timeframe)
        );
        return [...filtered, newSignal];
      });
    }
  };

  const connectWebSocket = () => {
    setIsLoading(true);

    try {
      // Ensure we always use the correct WebSocket URL
      const envUrl = process.env.NEXT_PUBLIC_WS_URL;
      const defaultUrl = "wss://api.signalstrading.app";
      
      // Force correct URL if environment variable is incorrect
      let url = envUrl || defaultUrl;
      
      // Fix common misconfigurations - ensure we use WSS through proxy
      if (url.includes(":8081") || url === "ws://api.signalstrading.app") {

        url = "wss://api.signalstrading.app";
      }
      
      // Ensure we use WSS through the proxy (standard port 443)
      if (url.includes("api.signalstrading.app") && url.startsWith("ws://")) {

        url = "wss://api.signalstrading.app";
      }
      
      // Ensure we use WSS protocol for security through proxy
      if (url.startsWith("ws://") && url.includes("signalstrading.app")) {

        url = "wss://api.signalstrading.app";
      }
      



      // Browser info check removed

      // Close existing connection if any
      if (ws) {

        ws.close();
      }

      const testWs = new WebSocket(url);

      testWs.onopen = () => {

        // Connection established
        
        // Reset reconnection counter on successful connection
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setIsLoading(false);
        setWs(testWs);

        // Send initial subscription message with all symbols
        const symbols = pairs.map(pair => pair.symbol);
        const subscribeMessage = {
          type: "subscribe",
          symbols: symbols
        };
        testWs.send(JSON.stringify(subscribeMessage));

      };

      testWs.onclose = (event) => {
        // WebSocket connection closed
        
        setIsConnected(false);
        setIsLoading(false);
        setWs(null);

        // Clear any existing timeout
        if (reconnectTimeoutId.current) {
          clearTimeout(reconnectTimeoutId.current);
        }

        // Only reconnect if:
        // 1. Not a clean close (user didn't intentionally disconnect)
        // 2. Haven't exceeded max attempts
        // 3. Error code suggests temporary issue (1006 = abnormal closure)
        if (!event.wasClean && 
            reconnectAttempts.current < maxReconnectAttempts.current && 
            (event.code === 1006 || event.code === 1001 || event.code === 1011)) {
          
          reconnectAttempts.current++;
          // Exponential backoff: 2^attempts * 1000ms (1s, 2s, 4s, 8s, 16s)
          const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
          

          
          reconnectTimeoutId.current = setTimeout(() => {

            connectWebSocket();
          }, delay);
        } else {
          // Not reconnecting
        }
      };

      testWs.onerror = (error) => {
        // WebSocket error occurred
        setIsLoading(false);
        setIsConnected(false);
        
        // For mobile compatibility, try reconnecting after a short delay
        if (reconnectAttempts.current < maxReconnectAttempts.current) {
          reconnectAttempts.current++;
          const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 10000);


          
          setTimeout(() => {

            connectWebSocket();
          }, delay);
        } else {

          // Try one more time with the direct port connection
          if (!url.includes(":8081")) {

            setTimeout(() => connectWebSocket(), 5000);
          }
        }
      };

      testWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          
          if (message.type === 'connection') {

            // Handle initial data if provided
            if (message.data) {

              processTraidingData(message.data);
            }
          } else if (message.type === 'trading_data') {

            processTraidingData(message.data);
          } else if (message.type === 'indicators') {
            // Legacy support
            handleIndicatorMessage(message as IndicatorMessage);
          } else {

          }
        } catch (error) {

        }
      };
      
      // Function to process trading data from WebSocket
      const processTraidingData = (data: any) => {
        // Convert backend data format to frontend format
        Object.keys(data).forEach(symbol => {
          const symbolData = data[symbol];
          Object.keys(symbolData).forEach(timeframe => {
            const indicators = symbolData[timeframe];
            if (indicators && indicators.type === 'indicators') {
              handleIndicatorMessage(indicators as IndicatorMessage);
            }
          });
        });
      };
    } catch (error) {
      console.error("💥 Failed to setup WebSocket:", error);
      setIsLoading(false);
      setIsConnected(false);
    }
  };

  // Load pairs from API
  const loadPairs = useCallback(async () => {
    try {

      const response = await fetch('/api/pairs');
      const data = await response.json();
      
      if (data.success && data.pairs) {

        // Only update pairs that aren't already present to avoid losing WebSocket data
        setPairs(currentPairs => {
          const apiPairs = data.pairs.map((apiPair: any) => {
            const existingPair = currentPairs.find(p => p.symbol === apiPair.symbol);
            return existingPair || {
              ...apiPair,
              indicators: {},
              signals: {}
            };
          });
          return apiPairs;
        });
      }
    } catch (error) {
      // Error loading pairs
    }
  }, []);

  // Handle new pair added
  const handlePairAdded = useCallback((newPair: any) => {
    setPairs(currentPairs => {
      const exists = currentPairs.find(p => p.symbol === newPair.symbol);
      if (!exists) {
        return [...currentPairs, {
          ...newPair,
          indicators: {},
          signals: {}
        }];
      }
      return currentPairs;
    });
  }, []);

  useEffect(() => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;

    loadPairs();
    connectWebSocket();

    // Cleanup function
    return () => {
      if (ws) {
        // Cleaning up WebSocket connection
        ws.close(1000, "Component unmounting"); // 1000 is normal closure
        setWs(null);
        setIsConnected(false);
      }
    };
  }, []); // Ensure this array is empty to run only once on mount

  // Clean up expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCrossSignals((prev) =>
        prev.filter((signal) => now - signal.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
        setScrollProgress(progress);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      // Initial calculation
      handleScroll();
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Detect mobile device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for pair addition events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const onPairAdded = (event: CustomEvent) => {
      const newPair = event.detail;

      handlePairAdded(newPair);
    };

    window.addEventListener('pairAdded', onPairAdded as EventListener);
    
    return () => {
      window.removeEventListener('pairAdded', onPairAdded as EventListener);
    };
  }, [handlePairAdded]);

  // Add this helper function
  const getCrossSignal = (symbol: string, timeframe: Timeframe) => {
    return crossSignals.find(
      (signal) =>
        signal.symbol === symbol &&
        signal.timeframe === timeframe &&
        Date.now() - signal.timestamp < 5000 // Only return if less than 5 seconds old
    );
  };

  // Modify renderSignal to use the indicators directly
  const renderSignal = (pair: TradingPair, timeframe: Timeframe) => {
    const indicator = pair.indicators[timeframe];

    if (!indicator) {
      return <div className="text-muted-foreground">Waiting for data...</div>;
    }

    // Recalculate signal using current settings
    const currentSignal = calculateSignal(indicator.wt1, settings);

    return (
      <div className={getSignalColor(currentSignal, settings)}>
        <span className="text-[8px]">
          WT1: {indicator.wt1?.toFixed(2)}, WT2: {indicator.wt2?.toFixed(2)}
          <br />
        </span>
      </div>
    );
  };

  // Modify the connect button handler
  const handleConnectionToggle = () => {
    if (isConnected && ws) {
      // User initiated disconnect
      ws.close(1000, "User initiated disconnect");
      setWs(null);
      setIsConnected(false);
    } else {
      // User initiated connect
      connectWebSocket();
    }
  };

  // Add this function to handle drag end
  const removePair = async (symbol: string) => {
    try {
      const response = await fetch(`/api/pairs?symbol=${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setPairs((current) => current.filter(pair => pair.symbol !== symbol));
        
        // Remove from localStorage pinned pairs
        const pinnedPairsJson = localStorage.getItem(PINNED_PAIRS_KEY);
        if (pinnedPairsJson) {
          const pinnedPairs = JSON.parse(pinnedPairsJson);
          delete pinnedPairs[symbol];
          localStorage.setItem(PINNED_PAIRS_KEY, JSON.stringify(pinnedPairs));
        }


        
        // Dispatch custom event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pairRemoved', { 
            detail: { symbol } 
          }));
        }
      } else {

      }
    } catch (error) {

    }
  };

  const onDragEnd = (result: any) => {
    // Disable drag-and-drop on mobile to prevent touch scrolling interference
    if (isMobile) return;
    
    if (!result.destination) return;

    const items = Array.from(pairs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Create order map
    const orderMap = items.reduce(
      (acc, item, index) => ({
        ...acc,
        [item.symbol]: index,
      }),
      {}
    );

    // Save to localStorage
    localStorage.setItem("pairsOrder", JSON.stringify(orderMap));

    // Update state
    setPairs(items);
  };

  const filteredPairs = pairs.filter((pair) =>
    pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAlert = async (symbol: string) => {
    // Initialize audio context on user interaction (important for mobile)
    initAudioContext();
    
    // Check current permission status
    const currentPermission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
    
    if (currentPermission === "denied") {
      // Show instructions for resetting permission
      console.log(`🔕 Browser notifications are blocked. Sound alerts will still work! To enable notifications:`);
      console.log(`🔄 Chrome/Edge: Click the 🔒 lock icon in address bar → Notifications → Allow`);
      console.log(`🔄 Firefox: Click the 🛡️ shield icon → Permissions → Notifications → Allow`);
      console.log(`🔄 Safari: Safari Menu → Settings → Websites → Notifications → Allow`);
      console.log(`🔄 Mobile: Browser Settings → Site Settings → Notifications → Allow`);
    } else if (currentPermission === "default") {
      // Request permission
      const permission = await Notification.requestPermission();
      console.log("Notification permission requested:", permission);
    }

    const currentPair = pairs.find(pair => pair.symbol === symbol);
    const willBeEnabled = !currentPair?.alerts;

    setPairs((current) =>
      current.map((pair) =>
        pair.symbol === symbol ? { ...pair, alerts: !pair.alerts } : pair
      )
    );

    // Test notification/sound when enabling alerts (works even if notifications are denied)
    if (willBeEnabled) {
      console.log("Testing alert system for", symbol);
      showNotification(symbol, `🔔 Alerts enabled for ${symbol}! You'll hear this sound when signals trigger.`);
    }

    // Update notification settings in state and localStorage
    setNotificationSettings((prev) => {
      const newSettings = {
        ...prev,
        [symbol]: !prev[symbol],
      };
      localStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      return newSettings;
    });
  };

  // Update the togglePin function to use localStorage
  const togglePin = (symbol: string) => {
    setPairs((current) => {
      const updatedPairs = current.map((pair) =>
        pair.symbol === symbol ? { ...pair, pinned: !pair.pinned } : pair
      );

      // Save pinned status to localStorage
      const pinnedPairsMap = updatedPairs.reduce(
        (acc, pair) => ({
          ...acc,
          [pair.symbol]: pair.pinned,
        }),
        {}
      );
      localStorage.setItem(PINNED_PAIRS_KEY, JSON.stringify(pinnedPairsMap));

      return updatedPairs;
    });
  };

  // Modify your sorting logic to account for pins
  const sortedPairs = sortByBuySignals
    ? [...filteredPairs].sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then by buy signals
        const aCount = countBuySignals(a);
        const bCount = countBuySignals(b);
        return bCount - aCount;
      })
    : filteredPairs.sort((a, b) => {
        // Sort only by pinned status when not sorting by buy signals
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });

  // Update the toggle handler
  const handleSortToggle = () => {
    const newValue = !sortByBuySignals;
    setSortByBuySignals(newValue);
    localStorage.setItem("sortByBuySignals", JSON.stringify(newValue));
  };

  const renderIndicators = useCallback(
    (pair: TradingPair, timeframe: Timeframe) => {
      const indicator = pair.indicators[timeframe];

      if (!indicator) {
        return (
          <div className="text-muted-foreground">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        );
      }

      const getIndicatorColor = (value: number, type: "wt" | "rsi" | "sma") => {
        if (type === "wt") {
          if (value >= settings.extremeSellThreshold) return "text-red-500";
          if (value <= settings.extremeBuyThreshold) return "text-green-500";
          if (value >= settings.sellThreshold) return "text-red-400";
          if (value <= settings.buyThreshold) return "text-green-400";
          return "text-blue-400";
        } else if (type === "rsi") {
          if (value >= RSI_OVERBOUGHT) return "text-red-500";
          if (value <= RSI_OVERSOLD) return "text-green-500";
          return "text-blue-400";
        } else {
          // sma
          return indicator.signals?.price_above_sma50
            ? "text-green-400"
            : "text-red-400";
        }
      };

      return (
        <div className="flex flex-col gap-0.5 p-0.5">
          {/* WaveTrend 1 and 2 */}
          <div className="flex flex-row items-center justify-center gap-1">
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.wt1, "wt")
              )}
            >
              <Waves className="w-3 h-3" />
              <span className="text-xs font-medium">
                {indicator.wt1?.toFixed(1)}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.wt2, "wt")
              )}
            >
              <Waves className="w-3 h-3" />
              <span className="text-xs font-medium">
                {indicator.wt2?.toFixed(1)}
              </span>
            </div>
          </div>

          {/* RSI and SMA50 */}
          <div className="flex flex-row items-center justify-center gap-1">
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.rsi, "rsi")
              )}
            >
              <LineChart className="w-3 h-3" />
              <span className="text-xs font-medium">
                {indicator.rsi?.toFixed(1)}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.sma50, "sma")
              )}
            >
              <BarChart2 className="w-3 h-3" />
              <span className="text-xs font-medium">
                {indicator.sma50?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      );
    },
    [settings]
  );

  // Add this function to test the bell sound
  const testBellSound = () => {
    playBell?.();
  };

  // Modify saveSettings to include debugging
  const saveSettings = (newSettings: WaveTrendSettings) => {
    console.log("Saving new settings:", newSettings);
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));

    // Recalculate signals for all pairs with new settings
    setPairs((currentPairs) => {
      return currentPairs.map((pair) => {
        const newSignals = Object.entries(pair.indicators).reduce(
          (acc, [timeframe, indicator]) => {
            return {
              ...acc,
              [timeframe]: calculateSignal(indicator.wt1, newSettings),
            };
          },
          {} as Record<Timeframe, SignalType>
        );

        return {
          ...pair,
          signals: newSignals,
        };
      });
    });

    setShowSettingsModal(false);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Controls Container */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4 px-4 w-full">
        <div className="flex items-center space-x-2">
          <Switch
            id="sort-mode"
            checked={sortByBuySignals}
            onCheckedChange={handleSortToggle}
          />
          <Label htmlFor="sort-mode" className="text-sm text-muted-foreground">
            Sort by Buy Signals {sortByBuySignals && `(Active)`}
          </Label>
        </div>

        <div className="flex items-center space-x-2 min-w-0">
          <Input
            type="search"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 max-w-[200px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            className="h-9 w-9 flex-shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotificationConsole(!showNotificationConsole)}
            className="flex-shrink-0"
          >
{showNotificationConsole ? "Hide Notifications" : "Show Notifications"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log("🔔 Manual subscription attempt...");
              const subscribed = await subscribeToNotifications();
              if (subscribed) {
                notificationLog("✅ Successfully subscribed to OneSignal notifications!");
                console.log("✅ Successfully subscribed to OneSignal notifications!");
              } else {
                notificationLog("❌ Failed to subscribe to notifications. Check browser permissions.");
                console.log("❌ Failed to subscribe to notifications. Check browser permissions.");
              }
            }}
            className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30"
          >
            🔔 Subscribe to Notifications
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log("🌐 Testing Web Push...");
              notificationLog("🧪 Testing Web Push notification system...");
              const success = await testWebPush();
              if (success) {
                notificationLog("✅ Web Push test successful! Check your device.");
                console.log("✅ Web Push test successful!");
              } else {
                notificationLog("❌ Web Push test failed. Check console for details.");
                console.log("❌ Web Push test failed.");
              }
            }}
            className="flex-shrink-0 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-800/30"
          >
            🌐 Test Web Push
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              initAudioContext();
              playNotificationSound();
              console.log("🧪 Test notification triggered - Sound + OneSignal + VAPID");
              
              // Test OneSignal notification first
              try {
                const oneSignalSuccess = await sendNotification(
                  "🧪 Test Alert - OneSignal",
                  "This is a test of the OneSignal notification system",
                  { test: true, timestamp: Date.now() }
                );
                
                if (oneSignalSuccess) {
                  console.log("✅ OneSignal notification sent successfully");
                  notificationLog("✅ OneSignal test notification sent");
                } else {
                  console.log("⚠️ OneSignal failed, trying VAPID fallback");
                  notificationLog("⚠️ OneSignal test failed, trying VAPID");
                  
                  // Fallback to VAPID test
                  const response = await fetch('/api/notifications/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      subscription: await getSubscription(),
                      title: "🧪 Test Alert - VAPID Fallback",
                      body: "This is a test of the VAPID push notification fallback",
                      tag: "test-notification",
                      url: "/signals"
                    }),
                  });
                  
                  if (response.ok) {
                    console.log("✅ VAPID fallback sent");
                    notificationLog("✅ VAPID fallback test sent");
                  } else {
                    console.log("❌ All notification systems failed");
                    notificationLog("❌ All notification tests failed");
                  }
                }
              } catch (error: any) {
                console.error("Notification test failed:", error);
                notificationLog(`❌ Test failed: ${error?.message || 'Unknown error'}`);
              }
            }}
            className="flex-shrink-0 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30"
          >
            🧪 Test Alert
          </Button>
          
          {/* Notification Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            {"Notification" in window && (
              <div className="flex items-center gap-1">
                {Notification.permission === "granted" && (
                  <span className="text-green-600 dark:text-green-400">🔔 Notifications ON</span>
                )}
                {Notification.permission === "denied" && (
                  <span className="text-orange-600 dark:text-orange-400" title="Notifications blocked - Sound alerts still work">
                    🔕 Sound Only
                  </span>
                )}
                {Notification.permission === "default" && (
                  <span className="text-gray-600 dark:text-gray-400">🔔 Click bell to enable</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-App Notifications */}
      {inAppNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {inAppNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300",
                notification.type === 'buy' 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                  : notification.type === 'sell'
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-sm font-semibold",
                      notification.type === 'buy' 
                        ? "text-green-800 dark:text-green-200" 
                        : notification.type === 'sell'
                        ? "text-red-800 dark:text-red-200"
                        : "text-blue-800 dark:text-blue-200"
                    )}>
                      {notification.type === 'buy' ? '📈' : notification.type === 'sell' ? '📉' : '🔔'} {notification.symbol}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs",
                    notification.type === 'buy' 
                      ? "text-green-700 dark:text-green-300" 
                      : notification.type === 'sell'
                      ? "text-red-700 dark:text-red-300"
                      : "text-blue-700 dark:text-blue-300"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setInAppNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Push Notification Console */}
      {showNotificationConsole && (
        <div className="mb-4 p-4 bg-blue-950 text-blue-200 rounded-lg font-mono text-xs max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-blue-300 font-bold flex items-center gap-2">
              <span>🔔</span> Push Notifications Log
            </h3>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                "bg-blue-500"
              )}></div>
              <span className="text-xs">Live</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotificationLogs([])}
                className="text-xs h-6 px-2 text-blue-400 hover:text-white"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            {notificationLogs.length === 0 ? (
              <div className="text-blue-400">No push notifications sent yet...</div>
            ) : (
              notificationLogs.map((log, index) => (
                <div key={index} className="break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile scroll hint with progress */}
      <div className="md:hidden mb-2 px-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>←→ Swipe to view all timeframes</span>
          <span>{Math.round(scrollProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Table Container - Mobile-optimized horizontal scroll */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-scroll overflow-y-visible touch-pan-x mobile-scroll-container" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'auto',
          scrollbarColor: 'rgba(59, 130, 246, 0.8) rgba(229, 231, 235, 0.3)'
        }}
      >
        <div className="bg-background dark:bg-gray-900 rounded-lg" style={{ 
          width: 'max-content',
          minWidth: 'max-content'
        }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Table>
              <TableHeader>
                <TableRow className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-left w-[140px]">Symbol</TableHead>
                  <TableHead className="text-right w-[80px]">Price</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                  {timeframes.map((tf) => (
                    <TableHead
                      key={tf}
                      className="text-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 w-[140px] px-3"
                    >
                      {tf}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <Droppable droppableId="pairs">
                {(provided) => (
                  <TableBody
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {sortedPairs.map((pair, index) => (
                      <Draggable
                        key={pair.symbol}
                        draggableId={pair.symbol}
                        index={index}
                        isDragDisabled={isMobile}
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "border-b dark:border-gray-800 hover:bg-gray-800/30 dark:hover:bg-gray-800/70",
                              snapshot.isDragging &&
                                "bg-gray-100 dark:bg-gray-800",
                              "cursor-move" // Add cursor indicator
                            )}
                          >
                            <TableCell className="w-[140px]">
                              <div className="flex items-center gap-2">
                                {pair.symbol}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "icon-button h-7 w-7",
                                      notificationSettings[pair.symbol]
                                        ? "text-amber-500 active-icon"
                                        : "text-gray-400 hover:text-amber-400"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAlert(pair.symbol);
                                    }}
                                  >
                                    <Bell
                                      className={cn(
                                        "bell-icon h-4 w-4",
                                        notificationSettings[pair.symbol] &&
                                          "animate-[wiggle_0.5s_cubic-bezier(0.36,0,0.66,1)]"
                                      )}
                                    />
                                  </Button>
                                  {/* Add the test button here */}
                                  {/* <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={testBellSound}
                                    className="h-7 w-7"
                                  >
                                    Test
                                  </Button> */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "icon-button h-7 w-7",
                                      pair.pinned
                                        ? "text-blue-500 active-icon"
                                        : "text-gray-400 hover:text-blue-400"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePin(pair.symbol);
                                    }}
                                  >
                                    <Pin
                                      className={cn(
                                        "pin-icon h-4 w-4",
                                        pair.pinned &&
                                          "animate-[bounce_0.5s_cubic-bezier(0.36,0,0.66,1)]"
                                      )}
                                    />
                                  </Button>
                                  {sortByBuySignals && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {countBuySignals(pair)} buys
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {pair.price?.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center w-[80px]">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removePair(pair.symbol);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove trading pair</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            {timeframes.map((tf) => (
                              <TableCell
                                key={tf}
                                className="text-center relative w-[140px] px-3"
                              >
                                {renderIndicators(pair, tf)}
                              </TableCell>
                            ))}
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </div>
      </div>

      {/* Add this Dialog component at the end, before the closing div */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WaveTrend Settings</DialogTitle>
            <DialogDescription>
              Adjust the thresholds for WaveTrend signals.
            </DialogDescription>
          </DialogHeader>

          {/* Add this section before the grid of settings */}
          <div className="flex items-center justify-between py-2 border-b">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Test your notification settings
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => testNotification(playBell || (() => {}))}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Test Notifications
            </Button>
          </div>

          {/* Existing settings grid */}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyThreshold" className="text-right">
                Buy Threshold
              </Label>
              <Input
                id="buyThreshold"
                type="number"
                defaultValue={settings.buyThreshold}
                className="col-span-3"
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    buyThreshold: Number(e.target.value),
                  };
                  setSettings(newSettings);
                }}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sellThreshold" className="text-right">
                Sell Threshold
              </Label>
              <Input
                id="sellThreshold"
                type="number"
                defaultValue={settings.sellThreshold}
                className="col-span-3"
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    sellThreshold: Number(e.target.value),
                  };
                  setSettings(newSettings);
                }}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extremeBuyThreshold" className="text-right">
                Extreme Buy
              </Label>
              <Input
                id="extremeBuyThreshold"
                type="number"
                defaultValue={settings.extremeBuyThreshold}
                className="col-span-3"
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    extremeBuyThreshold: Number(e.target.value),
                  };
                  setSettings(newSettings);
                }}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extremeSellThreshold" className="text-right">
                Extreme Sell
              </Label>
              <Input
                id="extremeSellThreshold"
                type="number"
                defaultValue={settings.extremeSellThreshold}
                className="col-span-3"
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    extremeSellThreshold: Number(e.target.value),
                  };
                  setSettings(newSettings);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => saveSettings(settings)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PairsTable;
