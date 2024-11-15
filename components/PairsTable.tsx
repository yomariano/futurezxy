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
const getSignalColor = (signal: SignalType) => {
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
  indicators: Record<Timeframe, {
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
  }>;
  order?: number;
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

interface IndicatorMessage {
  type: 'indicators';
  symbol: string;
  timeframe: string;
  timestamp: string;
  price: number;
  rsi: number;
  wt1: number;
  wt2: number;
  sma50: number;
  sma200: number;
  signals: {
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

  const handleIndicatorMessage = (data: IndicatorMessage) => {
    console.log('Received indicator message:', data);
    console.log('Current settings:', settings);
    
    const signal = calculateSignal(data.wt1, settings);
    console.log('Calculated signal:', signal);
    
    // Update timeframes if we receive a new one
    setTimeframes(current => {
      if (!current.includes(data.timeframe as Timeframe)) {
        return [...current, data.timeframe as Timeframe]
          .sort((a, b) => timeframeToMinutes(a) - timeframeToMinutes(b));
      }
      return current;
    });
    
    setPairs(currentPairs => {
      // Find existing pair
      const existingPair = currentPairs.find(p => p.symbol === data.symbol);
      
      if (existingPair) {
        // Update existing pair
        return currentPairs.map(pair => 
          pair.symbol === data.symbol
            ? {
                ...pair,
                price: data.price,
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
                    sma50: data.sma50,
                    sma200: data.sma200
                  }
                }
              }
            : pair
        );
      } else {
        // Create new pair
        const newPair: TradingPair = {
          symbol: data.symbol,
          price: data.price,
          signals: { [data.timeframe]: signal } as Record<Timeframe, SignalType>,
          indicators: {
            [data.timeframe]: {
              wt1: data.wt1,
              wt2: data.wt2,
              rsi: data.rsi,
              sma50: data.sma50,
              sma200: data.sma200
            }
          } as Record<Timeframe, {
            wt1: number;
            wt2: number;
            rsi: number;
            sma50: number;
            sma200: number;
          }>
        };
        return [...currentPairs, newPair];
      }
    });

    // Add debug logging
    if (data.signals.cross_over || data.signals.cross_under) {
      console.log('Cross signal detected:', {
        symbol: data.symbol,
        timeframe: data.timeframe,
        crossOver: data.signals.cross_over,
        crossUnder: data.signals.cross_under
      });
    }

    // Handle cross signals
    if (data.signals.cross_over || data.signals.cross_under) {
      const newSignal: CrossSignals = {
        symbol: data.symbol,
        timeframe: data.timeframe as Timeframe,
        timestamp: Date.now(),
        type: data.signals.cross_over ? 'cross_over' : 'cross_under'
      };
      
      console.log('Adding new cross signal:', newSignal);
      
      setCrossSignals(prev => {
        // Remove any existing signals for this symbol/timeframe combination
        const filtered = prev.filter(s => 
          !(s.symbol === data.symbol && s.timeframe === data.timeframe)
        );
        return [...filtered, newSignal];
      });
    }

    // Check for green signal on 1m timeframe and play sound if notifications are enabled
    if (data.timeframe === '1m' && 
        notificationSettings[data.symbol] && 
        (data.wt1 <= -53 || data.wt2 <= -53)) {
      playBell?.();
    }
  };

  const connectWebSocket = () => {
    setIsLoading(true);
    
    try {
        const url = 'ws://localhost:8765'
        //const url = 'wss://your-trading-bot.fly.dev/ws'

        console.log('🔄 Attempting WebSocket connection to:', url);
        
        // Close existing connection if any
        if (ws) {
            console.log('🔌 Closing existing connection');
            ws.close();
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
              handleIndicatorMessage(data as IndicatorMessage);
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
    
    return (
      <div className={getSignalColor(pair.signals[timeframe])}>
        <span className="text-[8px]">
         WT1: {indicator.wt1?.toFixed(2)}, 
          WT2: {indicator.wt2?.toFixed(2)}<br/>
            {/*SMA50: {indicator.sma50.toFixed(2)},
          SMA200: {indicator.sma200.toFixed(2)} */}
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

  const renderIndicators = useCallback((pair: TradingPair, timeframe: Timeframe) => {
    const indicator = pair.indicators[timeframe];
    
    if (!indicator) {
      return (
        <div className="text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
      );
    }

    const getIndicatorColor = (value: number, type: 'wt' | 'rsi' | 'sma') => {
      if (type === 'wt') {
        if (value >= EXTREME_THRESHOLD) return "text-red-500";
        if (value <= -EXTREME_THRESHOLD) return "text-green-500";
        if (value >= 53) return "text-red-400";
        if (value <= -53) return "text-green-400";
        return "text-blue-400";
      } else if (type === 'rsi') {
        if (value >= RSI_OVERBOUGHT) return "text-red-500";
        if (value <= RSI_OVERSOLD) return "text-green-500";
        return "text-blue-400";
      } else { // sma
        return indicator.signals?.price_above_sma50 ? "text-green-400" : "text-red-400";
      }
    };

    return (
      <div className="flex flex-col gap-0.5 p-0.5">
        {/* WaveTrend 1 and 2 */}
        <div className="flex flex-row items-center justify-center gap-1">
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.wt1, 'wt')
          )}>
            <Waves className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.wt1?.toFixed(1)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.wt2, 'wt')
          )}>
            <Waves className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.wt2?.toFixed(1)}
            </span>
          </div>
        </div>

        {/* RSI and SMA50 */}
        <div className="flex flex-row items-center justify-center gap-1">
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.rsi, 'rsi')
          )}>
            <LineChart className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.rsi?.toFixed(1)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-0.5 rounded-sm px-0.5 py-0.5",
            "bg-background/50 hover:bg-background/80 transition-colors",
            getIndicatorColor(indicator.sma50, 'sma')
          )}>
            <BarChart2 className="w-3 h-3" />
            <span className="text-xs font-medium">
              {indicator.sma50?.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

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
      console.log('Current pairs before update:', currentPairs);
      
      const updatedPairs = currentPairs.map(pair => {
        const newSignals = Object.entries(pair.indicators).reduce((acc, [timeframe, indicator]) => {
          const newSignal = calculateSignal(indicator.wt1, newSettings);
          console.log(`Recalculating for ${pair.symbol} ${timeframe}:`, {
            wt1: indicator.wt1,
            threshold: newSettings.buyThreshold,
            newSignal
          });
          return {
            ...acc,
            [timeframe]: newSignal
          };
        }, {} as Record<Timeframe, SignalType>);

        return {
          ...pair,
          signals: newSignals
        };
      });

      console.log('Updated pairs:', updatedPairs);
      return updatedPairs;
    });
    
    setShowSettingsModal(false);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-4">
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
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add the Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WaveTrend Settings</DialogTitle>
            <DialogDescription>
              Customize the thresholds for WaveTrend signals
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newSettings = {
              buyThreshold: Number(formData.get('buyThreshold')),
              sellThreshold: Number(formData.get('sellThreshold')),
              extremeBuyThreshold: Number(formData.get('extremeBuyThreshold')),
              extremeSellThreshold: Number(formData.get('extremeSellThreshold'))
            };
            saveSettings(newSettings);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="buyThreshold" className="text-right">
                  Buy Signal
                </Label>
                <Input
                  id="buyThreshold"
                  name="buyThreshold"
                  type="number"
                  defaultValue={settings.buyThreshold}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellThreshold" className="text-right">
                  Sell Signal
                </Label>
                <Input
                  id="sellThreshold"
                  name="sellThreshold"
                  type="number"
                  defaultValue={settings.sellThreshold}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="extremeBuyThreshold" className="text-right">
                  Extreme Buy
                </Label>
                <Input
                  id="extremeBuyThreshold"
                  name="extremeBuyThreshold"
                  type="number"
                  defaultValue={settings.extremeBuyThreshold}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="extremeSellThreshold" className="text-right">
                  Extreme Sell
                </Label>
                <Input
                  id="extremeSellThreshold"
                  name="extremeSellThreshold"
                  type="number"
                  defaultValue={settings.extremeSellThreshold}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="relative overflow-x-auto bg-background dark:bg-gray-900 rounded-lg w-full">
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
                            {pair.price?.toFixed(2)}
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
  )
}

export default PairsTable
