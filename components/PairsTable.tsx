"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Activity, Waves, LineChart, BarChart2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Bell, Pin, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h';

// Update the signal types to include extreme states
type SignalType = 'buy' | 'sell' | 'neutral' | 'near-buy' | 'near-sell' | 'extreme-buy' | 'extreme-sell';

// Update the color function
const getSignalColor = (signal: SignalType, settings: WaveTrendSettings) => {
  switch (signal) {
    case 'extreme-buy':
      return 'text-green-600 dark:text-green-500';
    case 'buy':
      return 'text-green-500 dark:text-green-400';
    case 'near-buy':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'extreme-sell':
      return 'text-red-600 dark:text-red-500';
    case 'sell':
      return 'text-red-500 dark:text-red-400';
    case 'near-sell':
      return 'text-rose-500 dark:text-rose-400';
    default:
      return 'text-blue-500 dark:text-blue-400';
  }
};

// Add this new interface near other interfaces
interface ColorChangeTimestamp {
  timestamp: number;
  color: 'red' | 'green';
}

// Simplify the message interface to match the actual data
interface WaveTrendMessage {
  symbol: string;
  timeframe: string;
  timestamp: string;
  wt1: number;
  wt2: number;
  rsi: number;
}

// Simplify the TradingPair interface
interface TradingPair {
  symbol: string;
  signals: Record<Timeframe, SignalType>;
  indicators: Record<Timeframe, {
    wt1: number;
    wt2: number;
    rsi: number;
  }>;
  pinned?: boolean;
}

// Modify calculateSignal to accept settings as a parameter
const calculateSignal = (wt: number, settings: WaveTrendSettings): SignalType => {
  console.log('Calculating signal:', { wt, settings });
  
  const TRANSITION_PERCENTAGE = 0.05;
  
  const buyTransitionZone = settings.buyThreshold + (Math.abs(settings.buyThreshold) * TRANSITION_PERCENTAGE);
  const sellTransitionZone = settings.sellThreshold - (settings.sellThreshold * TRANSITION_PERCENTAGE);

  if (wt <= settings.extremeBuyThreshold) {
    return 'extreme-buy';
  }
  if (wt >= settings.extremeSellThreshold) {
    return 'extreme-sell';
  }
  if (wt <= settings.buyThreshold) {
    return 'buy';
  }
  if (wt <= buyTransitionZone) {
    return 'near-buy';
  }
  if (wt >= settings.sellThreshold) {
    return 'sell';
  }
  if (wt >= sellTransitionZone) {
    return 'near-sell';
  }
  return 'neutral';
};

// Add this helper function at the top of the file, with the other utility functions
const timeframeOrder: Record<string, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 6,
  '1d': 7,
  '1w': 8,
};

// Add this helper function at the top of the file
const timeframeToMinutes = (timeframe: string): number => {
  const value = parseInt(timeframe);
  const unit = timeframe.slice(-1);
  
  switch(unit) {
    case 'm': return value;
    case 'h': return value * 60;
    case 'd': return value * 60 * 24;
    case 'w': return value * 60 * 24 * 7;
    default: return 0;
  }
};

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
  type: 'cross_over' | 'cross_under';
}

// Add with other utility functions
const countBuySignals = (pair: TradingPair): number => {
  return Object.values(pair.signals).reduce((count, signal) => {
    if (signal === 'extreme-buy' || signal === 'buy' || signal === 'near-buy') {
      return count + 1;
    }
    return count;
  }, 0);
};

// Add these constants right after the imports and before any type definitions
const EXTREME_THRESHOLD = 80;  // For WaveTrend extreme signals
const RSI_OVERBOUGHT = 70;     // For RSI overbought
const RSI_OVERSOLD = 30;       // For RSI oversold

// Add this near the top of the file after imports
const NOTIFICATION_SETTINGS_KEY = 'pairNotificationSettings';

// Add this interface with the other interfaces
interface NotificationSettings {
  [symbol: string]: boolean;
}

// Replace the audio file constant and add this utility function
const createBellSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Bell-like sound settings
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // Higher frequency for bell sound
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };
};

// Add these constants at the top of the file
const SETTINGS_KEY = 'waveTrendSettings';
const DEFAULT_SETTINGS = {
  buyThreshold: -53,
  sellThreshold: 53,
  extremeBuyThreshold: -80,
  extremeSellThreshold: 80
};

// Add this interface with other interfaces
interface WaveTrendSettings {
  buyThreshold: number;
  sellThreshold: number;
  extremeBuyThreshold: number;
  extremeSellThreshold: number;
}

// Add this constant with other constants
const PINNED_PAIRS_KEY = 'pinnedPairs';

// Add this near your other utility functions
const showNotification = (symbol: string, message: string) => {
  console.log('Attempting to show notification:', { symbol, message });
  
  if ('Notification' in window) {
    console.log('Notification permission:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      const notificationSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');
      console.log('Notification settings:', notificationSettings);
      
      if (notificationSettings[symbol]) {
        try {
          const notification = new Notification(`${symbol} Trading Alert 📈`, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `trading-${symbol}`,
            requireInteraction: true,
            silent: false,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          console.log('Notification sent successfully');
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        console.log('Permission requested:', permission);
        if (permission === 'granted') {
          showNotification(symbol, message);
        }
      });
    }
  }
};

// Update the testNotification function
const testNotification = (playBellSound?: () => void) => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        // Create notification with supported options
        const notification = new Notification('Trading Alert 📈', {
          body: 'This is a test trading notification',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: true, // Notification persists until user interacts
          silent: false, // Allow system sound
        });

        // Add click handler
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Play custom sound
        playBellSound?.();
      } catch (error) {
        console.error('Error sending test notification:', error);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          testNotification(playBellSound);
        }
      });
    } else {
      // If notifications are denied, show a message to the user
      alert('Please enable notifications in your browser settings to receive trading alerts.');
    }
  }
};

const PairsTable = () => {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const connectionAttempted = useRef(false);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [crossSignals, setCrossSignals] = useState<CrossSignals[]>([]);
  const [sortByBuySignals, setSortByBuySignals] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({});
  const [playBell, setPlayBell] = useState<(() => void) | null>(null);
  const [settings, setSettings] = useState<WaveTrendSettings>(DEFAULT_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load saved order on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('pairsOrder');
    if (savedOrder) {
      const orderMap = JSON.parse(savedOrder);
      setPairs(current => 
        [...current].sort((a, b) => 
          (orderMap[a.symbol] || 0) - (orderMap[b.symbol] || 0)
        )
      );
    }
  }, []);

  // Add with other useEffects
  useEffect(() => {
    const savedSort = localStorage.getItem('sortByBuySignals');
    if (savedSort) {
      setSortByBuySignals(JSON.parse(savedSort));
    }
  }, []);

  // Replace the audio initialization effect with this
  useEffect(() => {
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
      setPairs(current => 
        current.map(pair => ({
          ...pair,
          pinned: pinnedPairsMap[pair.symbol] || false
        }))
      );
    }
  }, []);

  // Add this useEffect to request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      // Request permission on component mount
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission status:', permission);
        });
      }
      
      // Log current permission status
      console.log('Current notification permission:', Notification.permission);
    } else {
      console.log('Notifications not supported in this browser');
    }
  }, []);

  // Update the handleIndicatorMessage function
  const handleIndicatorMessage = (data: WaveTrendMessage) => {
    console.log('Received indicator message:', data);
    console.log('Current settings:', settings);
    
    const signal = calculateSignal(data.wt1, settings);
    console.log('Calculated signal:', signal);
    
    setTimeframes(current => {
      if (!current.includes(data.timeframe as Timeframe)) {
        return [...current, data.timeframe as Timeframe]
          .sort((a, b) => timeframeToMinutes(a) - timeframeToMinutes(b));
      }
      return current;
    });
    
    setPairs(currentPairs => {
      const existingPair = currentPairs.find(p => p.symbol === data.symbol);
      
      if (existingPair) {
        return currentPairs.map(pair => 
          pair.symbol === data.symbol
            ? {
                ...pair,
                signals: {
                  ...pair.signals,
                  [data.timeframe]: signal
                },
                indicators: {
                  ...pair.indicators,
                  [data.timeframe]: {
                    wt1: data.wt1,
                    wt2: data.wt2,
                    rsi: data.rsi,
                  }
                }
              }
            : pair
        );
      } else {
        const newPair: TradingPair = {
          symbol: data.symbol,
          signals: { [data.timeframe]: signal } as Record<Timeframe, SignalType>,
          indicators: {
            [data.timeframe]: {
              wt1: data.wt1,
              wt2: data.wt2,
              rsi: data.rsi,
            }
          } as Record<Timeframe, {
            wt1: number;
            wt2: number;
            rsi: number;
          }>
        };
        return [...currentPairs, newPair];
      }
    });
  };

  const connectWebSocket = () => {
    setIsLoading(true);
    
    try {
        //const url = 'ws://localhost:8765'
        const url = process.env.NEXT_PUBLIC_WSS_URL;//'wss://your-trading-bot.fly.dev/ws'

        console.log('🔄 Attempting WebSocket connection to:', url);
        
        // Close existing connection if any
        if (ws) {
            console.log('🔌 Closing existing connection');
            ws.close();
        }

        if (!url) {
            console.error('❌ WebSocket URL is undefined');
            setIsLoading(false);
            return;
        }

        const testWs = new WebSocket(url);
            
        testWs.onopen = () => {
            console.log('🟢 WebSocket connection established');
            setIsConnected(true);
            setIsLoading(false);
            setWs(testWs);
            
            // Send initial subscription message
            pairs.forEach(pair => {
              const subscribeMessage = {
                type: 'subscribe',
                symbol: pair.symbol
              };
              testWs.send(JSON.stringify(subscribeMessage));
            });
            console.log('📤 Sent subscription messages:', pairs);
        };
            
        testWs.onclose = (event) => {
            console.log('🔴 WebSocket connection closed:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
                timestamp: new Date().toISOString()
            });
            
            setIsConnected(false);
            setIsLoading(false);
            setWs(null);

            // Attempt to reconnect after 5 seconds if it wasn't a clean close
            if (!event.wasClean) {
                console.log('🔄 Scheduling reconnection attempt...');
                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connectWebSocket();
                }, 5000);
            }
        };
            
        testWs.onerror = (error) => {
            console.error('❌ WebSocket error occurred:', {
                error,
                timestamp: new Date().toISOString(),
                readyState: testWs.readyState,
                // Log the WebSocket ready state as a string for better debugging
                readyStateString: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][testWs.readyState]
            });
        };
            
        testWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('📨 Received message:', data);

            if (data.type === 'indicators') {
              handleIndicatorMessage(data as WaveTrendMessage);
            }
        };

    } catch (error) {
        console.error('💥 Failed to setup WebSocket:', error);
        setIsLoading(false);
        setIsConnected(false);
    }
};

  useEffect(() => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;
    
    connectWebSocket();

    // Cleanup function
    return () => {
        if (ws) {
            console.log('🧹 Cleaning up WebSocket connection');
            ws.close(1000, 'Component unmounting'); // 1000 is normal closure
            setWs(null);
            setIsConnected(false);
        }
    };
}, []); // Ensure this array is empty to run only once on mount

  // Clean up expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCrossSignals(prev => 
        prev.filter(signal => now - signal.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add this helper function
  const getCrossSignal = (symbol: string, timeframe: Timeframe) => {
    return crossSignals.find(
      signal => signal.symbol === symbol && 
               signal.timeframe === timeframe &&
               Date.now() - signal.timestamp < 5000 // Only return if less than 5 seconds old
    );
  };

  // Modify renderSignal to use the indicators directly
  const renderSignal = (pair: TradingPair, timeframe: Timeframe) => {
    const indicator = pair.indicators[timeframe];
    
    if (!indicator) {
      return (
        <div className="text-muted-foreground">
          Waiting for data...
        </div>
      );
    }
    
    // Recalculate signal using current settings
    const currentSignal = calculateSignal(indicator.wt1, settings);
    
    return (
      <div className={getSignalColor(currentSignal, settings)}>
        <span className="text-[8px]">
         WT1: {indicator.wt1?.toFixed(2)}, 
          WT2: {indicator.wt2?.toFixed(2)}<br/>
        </span>
      </div>
    );
  };

  // Modify the connect button handler
  const handleConnectionToggle = () => {
    if (isConnected && ws) {
        console.log('👋 User initiated disconnect');
        ws.close(1000, 'User initiated disconnect');
        setWs(null);
        setIsConnected(false);
    } else {
        console.log('🤝 User initiated connect');
        connectWebSocket();
    }
};

  // Add this function to handle drag end
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(pairs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Create order map
    const orderMap = items.reduce((acc, item, index) => ({
      ...acc,
      [item.symbol]: index
    }), {});
    
    // Save to localStorage
    localStorage.setItem('pairsOrder', JSON.stringify(orderMap));
    
    // Update state
    setPairs(items);
  };

  const filteredPairs = pairs.filter(pair =>
    pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAlert = (symbol: string) => {
    setPairs(current =>
      current.map(pair =>
        pair.symbol === symbol
          ? { ...pair, alerts: !pair.alerts }
          : pair
      )
    );

    // Update notification settings in state and localStorage
    setNotificationSettings(prev => {
      const newSettings = {
        ...prev,
        [symbol]: !prev[symbol]
      };
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // Update the togglePin function to use localStorage
  const togglePin = (symbol: string) => {
    setPairs(current => {
      const updatedPairs = current.map(pair =>
        pair.symbol === symbol
          ? { ...pair, pinned: !pair.pinned }
          : pair
      );
      
      // Save pinned status to localStorage
      const pinnedPairsMap = updatedPairs.reduce((acc, pair) => ({
        ...acc,
        [pair.symbol]: pair.pinned
      }), {});
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
    localStorage.setItem('sortByBuySignals', JSON.stringify(newValue));
  };

  // Update the renderIndicators function
  const renderIndicators = useCallback((pair: TradingPair, timeframe: Timeframe) => {
    const indicator = pair.indicators[timeframe];
    
    if (!indicator) {
      return (
        <div className="text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
      );
    }

    const getIndicatorColor = (value: number) => {
      if (value >= settings.extremeSellThreshold) return "text-red-500";
      if (value <= settings.extremeBuyThreshold) return "text-green-500";
      if (value >= settings.sellThreshold) return "text-red-400";
      if (value <= settings.buyThreshold) return "text-green-400";
      return "text-blue-400";
    };

    const getRsiColor = (value: number) => {
      if (value >= RSI_OVERBOUGHT) return "text-red-500";
      if (value <= RSI_OVERSOLD) return "text-green-500";
      return "text-blue-400";
    };

    return (
      <div className="flex flex-col gap-0.5 p-0.5">
        <div className="flex flex-row items-center justify-center gap-1">
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.wt1)
          )}>
            <Waves className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.wt1?.toFixed(1)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.wt2)
          )}>
            <Waves className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.wt2?.toFixed(1)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getRsiColor(indicator.rsi)
          )}>
            <LineChart className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.rsi?.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    );
  }, [settings]);

  // Add this function to test the bell sound
  const testBellSound = () => {
    playBell?.();
  };

  // Modify saveSettings to include debugging
  const saveSettings = (newSettings: WaveTrendSettings) => {
    console.log('Saving new settings:', newSettings);
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    
    // Recalculate signals for all pairs with new settings
    setPairs(currentPairs => {
      return currentPairs.map(pair => {
        const newSignals = Object.entries(pair.indicators).reduce((acc, [timeframe, indicator]) => {
          return {
            ...acc,
            [timeframe]: calculateSignal(indicator.wt1, newSettings)
          };
        }, {} as Record<Timeframe, SignalType>);

        return {
          ...pair,
          signals: newSignals
        };
      });
    });
    
    setShowSettingsModal(false);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Controls Container - Now with max-width constraint */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4 px-4 sm:px-6 md:px-0 max-w-[1200px] mx-auto">
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
        </div>
      </div>

      {/* Table Container - Now with horizontal scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-full w-max max-w-none bg-background dark:bg-gray-900 rounded-lg">
          <DragDropContext onDragEnd={onDragEnd}>
            <Table>
              <TableHeader>
                <TableRow className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-left w-[140px]">Symbol</TableHead>
                  <TableHead className="text-right w-[80px]">Price</TableHead>
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
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "border-b dark:border-gray-800 hover:bg-gray-800/30 dark:hover:bg-gray-800/70",
                              snapshot.isDragging && "bg-gray-100 dark:bg-gray-800",
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
                                        notificationSettings[pair.symbol] && "animate-[wiggle_0.5s_cubic-bezier(0.36,0,0.66,1)]"
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
                                        pair.pinned && "animate-[bounce_0.5s_cubic-bezier(0.36,0,0.66,1)]"
                                      )}
                                    />
                                  </Button>
                                  {sortByBuySignals && (
                                    <Badge variant="secondary" className="text-xs">
                                      {countBuySignals(pair)} buys
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {pair.currentPrice?.toFixed(2)}
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
                    buyThreshold: Number(e.target.value)
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
                    sellThreshold: Number(e.target.value)
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
                    extremeBuyThreshold: Number(e.target.value)
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
                    extremeSellThreshold: Number(e.target.value)
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
            <Button 
              onClick={() => saveSettings(settings)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PairsTable
