"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Activity, Waves, LineChart, BarChart2, CircleDot } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Add these constants right after the imports and before any type definitions
const EXTREME_THRESHOLD = 80;  // For WaveTrend extreme signals
const RSI_OVERBOUGHT = 70;     // For RSI overbought
const RSI_OVERSOLD = 30;       // For RSI oversold

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

// Add new interface for the WebSocket message
interface WaveTrendMessage {
  type: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  wt1: number;
  wt2: number;
  sma50: number;
  sma200: number;
}

interface TradingPair {
  symbol: string;
  price?: number;
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

// Modified function to calculate signal including extreme conditions
const calculateSignal = (wt: number): SignalType => {
  const EXTREME_THRESHOLD = 80;
  const BUY_THRESHOLD = -53;
  const SELL_THRESHOLD = 53;
  const TRANSITION_PERCENTAGE = 0.05;
  
  const buyTransitionZone = BUY_THRESHOLD + (Math.abs(BUY_THRESHOLD) * TRANSITION_PERCENTAGE);
  const sellTransitionZone = SELL_THRESHOLD - (SELL_THRESHOLD * TRANSITION_PERCENTAGE);

  if (wt <= -EXTREME_THRESHOLD) {
    return 'extreme-buy';
  }
  if (wt >= EXTREME_THRESHOLD) {
    return 'extreme-sell';
  }
  if (wt <= BUY_THRESHOLD) {
    return 'buy';
  }
  if (wt <= buyTransitionZone) {
    return 'near-buy';
  }
  if (wt >= SELL_THRESHOLD) {
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

// Add this new interface near other interfaces
interface ColorChangeTimestamp {
  timestamp: number;
  color: 'red' | 'green';
}

// Add this to your TradingPair interface
interface TradingPair {
  symbol: string;
  price?: number;
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

// Add this helper function
const getTimeSince = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  return `${seconds}s`;
};

// Add new interface for divergence signals
interface DivergenceSignals {
  bearish: boolean;
  bullish: boolean;
  hidden_bearish: boolean;
  hidden_bullish: boolean;
}

// Add this helper function
const getDivergenceSignals = (pair: TradingPair, timeframe: Timeframe): DivergenceSignals | undefined => {
  const indicator = pair.indicators[timeframe];
  if (!indicator?.signals) return undefined;
  
  return {
    bearish: indicator.signals.bearish_divergence,
    bullish: indicator.signals.bullish_divergence,
    hidden_bearish: indicator.signals.hidden_bearish_divergence,
    hidden_bullish: indicator.signals.hidden_bullish_divergence
  };
};

const PairRow = memo(({ pair, timeframes, renderIndicators }: { 
  pair: TradingPair; 
  timeframes: Timeframe[];
  renderIndicators: (pair: TradingPair, tf: Timeframe) => React.ReactNode;
}) => {
  return (
    <TableRow>
      <TableCell>{pair.symbol}</TableCell>
      <TableCell>{pair.price?.toFixed(2)}</TableCell>
      {timeframes.map((tf) => (
        <TableCell key={tf}>
          {renderIndicators(pair, tf)}
        </TableCell>
      ))}
    </TableRow>
  );
});

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

  const handleIndicatorMessage = (data: IndicatorMessage) => {
    console.log('📊 Handling indicator message:', data);
    
    setPairs(currentPairs => {
      const pairIndex = currentPairs.findIndex(p => p.symbol === data.symbol);
      
      if (pairIndex === -1) {
        // Create new pair if it doesn't exist
        const newPair: TradingPair = {
          symbol: data.symbol,
          price: data.price,
          signals: {} as Record<Timeframe, SignalType>,
          indicators: {} as Record<Timeframe, any>
        };
        return [...currentPairs, newPair];
      }

      const newPairs = [...currentPairs];
      const pair = { ...newPairs[pairIndex] };
      
      // Update pair data
      pair.price = data.price;
      pair.indicators = {
        ...pair.indicators,
        [data.timeframe as Timeframe]: {
          wt1: data.wt1,
          wt2: data.wt2,
          sma50: data.sma50,
          sma200: data.sma200,
          rsi: data.rsi,
          signals: data.signals
        }
      };
      
      newPairs[pairIndex] = pair;
      return newPairs;
    });

    // Update timeframes if needed
    if (!timeframes.includes(data.timeframe as Timeframe)) {
      setTimeframes(current => Array.from(new Set([...current, data.timeframe as Timeframe]))
        .sort((a, b) => timeframeToMinutes(a) - timeframeToMinutes(b))
      );
    }
  };

  const connectWebSocket = useCallback(() => {
    setIsLoading(true);
    
    try {
      const url = 'ws://localhost:8081';
      console.log('🔄 Attempting WebSocket connection to:', url);
      
      const testWs = new WebSocket(url);
          
      testWs.onopen = () => {
        console.log('🟢 WebSocket connection established');
        setIsConnected(true);
        setIsLoading(false);
        setWs(testWs);
        
        // Send a test message
        const testMessage = {
          type: 'subscribe',
          symbol: 'BTCUSDT'  // or whatever test symbol you want
        };
        testWs.send(JSON.stringify(testMessage));
        console.log('📤 Sent test message:', testMessage);
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
        try {
          // Log raw message for debugging
          console.log('📦 Raw message:', event.data);
          
          // Try to parse the JSON and sanitize any NaN values
          let data;
          if (typeof event.data === 'string') {
            // Replace NaN with null in the string before parsing
            const sanitizedData = event.data.replace(/: NaN/g, ': null');
            data = JSON.parse(sanitizedData);
          } else {
            console.warn('⚠️ Received non-string message:', event.data);
            return;
          }

          // Validate the parsed data
          if (data && typeof data === 'object' && data.type === 'indicators') {
            // Ensure all numeric fields are valid numbers
            const sanitizedData = {
              ...data,
              wt1: Number.isFinite(data.wt1) ? data.wt1 : null,
              wt2: Number.isFinite(data.wt2) ? data.wt2 : null,
              sma50: Number.isFinite(data.sma50) ? data.sma50 : null,
              sma200: Number.isFinite(data.sma200) ? data.sma200 : null,
              rsi: Number.isFinite(data.rsi) ? data.rsi : null,
              price: Number.isFinite(data.price) ? data.price : null
            };

            console.log('📨 Sanitized message:', sanitizedData);
            handleIndicatorMessage(sanitizedData as IndicatorMessage);
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', {
            error,
            rawData: event.data,
            timestamp: new Date().toISOString()
          });
        }
      };

    } catch (error) {
      console.error('💥 Failed to setup WebSocket:', error);
      setIsLoading(false);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!connectionAttempted.current) {
      connectionAttempted.current = true;
      connectWebSocket();
    }
    
    return () => {
      if (ws) {
        ws.close(1000, 'Component unmounting');
        setWs(null);
        setIsConnected(false);
      }
    };
  }, [connectWebSocket]);

  // Clean up expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCrossSignals(prev => 
        prev.filter(signal => now - signal.timestamp < 10000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add this helper function
  const getCrossSignal = (symbol: string, timeframe: Timeframe) => {
    const signal = crossSignals.find(
      signal => signal.symbol === symbol && 
               signal.timeframe === timeframe &&
               Date.now() - signal.timestamp < 10000
    );
    
    // Add debug log
    // console.log('🔍 Getting cross signal:', {
    //   symbol,
    //   timeframe,
    //   found: !!signal,
    //   signal,
    //   allSignals: crossSignals
    // });
    
    return signal;
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
      <div className="flex flex-col gap-1.5 p-1">
        <TooltipProvider>
          {/* WaveTrend 1 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.wt1, 'wt')
              )}>
                <Waves className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {indicator.wt1.toFixed(1)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>WaveTrend 1: {indicator.wt1.toFixed(2)}</p>
            </TooltipContent>
          </Tooltip>

          {/* WaveTrend 2 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.wt2, 'wt')
              )}>
                <Waves className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {indicator.wt2?.toFixed(1)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>WaveTrend 2: {indicator.wt2.toFixed(2)}</p>
            </TooltipContent>
          </Tooltip>

          {/* RSI */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.rsi, 'rsi')
              )}>
                <LineChart className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {indicator.rsi?.toFixed(1)}
                </span>
                {indicator.signals?.overbought && <TrendingUp className="w-3 h-3 text-red-500" />}
                {indicator.signals?.oversold && <TrendingDown className="w-3 h-3 text-green-500" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-1">
                <p>RSI: {indicator.rsi?.toFixed(2)}</p>
                {indicator.signals?.overbought && <p className="text-red-500">Overbought</p>}
                {indicator.signals?.oversold && <p className="text-green-500">Oversold</p>}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* SMA50 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.sma50, 'sma')
              )}>
                <BarChart2 className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {indicator.sma50.toFixed(1)}
                </span>
                {indicator.signals?.price_above_sma50 ? 
                  <ArrowUpCircle className="w-3 h-3 text-green-500" /> : 
                  <ArrowDownCircle className="w-3 h-3 text-red-500" />
                }
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-1">
                <p>SMA50: {indicator.sma50.toFixed(2)}</p>
                <p className={indicator.signals?.price_above_sma50 ? "text-green-500" : "text-red-500"}>
                  Price {indicator.signals?.price_above_sma50 ? "above" : "below"} SMA50
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* SMA200 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
                "bg-background/50 hover:bg-background/80 transition-colors",
                getIndicatorColor(indicator.sma200, 'sma')
              )}>
                <CircleDot className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {indicator.sma200.toFixed(1)}
                </span>
                {indicator.signals?.price_above_sma200 ? 
                  <ArrowUpCircle className="w-3 h-3 text-green-500" /> : 
                  <ArrowDownCircle className="w-3 h-3 text-red-500" />
                }
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-1">
                <p>SMA200: {indicator.sma200.toFixed(2)}</p>
                <p className={indicator.signals?.price_above_sma200 ? "text-green-500" : "text-red-500"}>
                  Price {indicator.signals?.price_above_sma200 ? "above" : "below"} SMA200
                </p>
                {indicator.signals?.sma50_above_sma200 && 
                  <p className="text-green-500">Golden Cross (SMA50 {">"} SMA200)</p>
                }
                {!indicator.signals?.sma50_above_sma200 && 
                  <p className="text-red-500">Death Cross (SMA50 {">"} SMA200)</p>
                }
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }, []);

  // Modify the connect button handler
  const handleConnectionToggle = () => {
    if (isConnected && ws) {
        console.log(' User initiated disconnect');
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

  // Add these memoized values
  const memoizedSortedPairs = useMemo(() => 
    sortByBuySignals 
      ? [...pairs].sort((a, b) => {
          const aCount = countBuySignals(a);
          const bCount = countBuySignals(b);
          return bCount - aCount;
        })
      : pairs,
    [pairs, sortByBuySignals]
  );

  const memoizedFilteredPairs = useMemo(() =>
    memoizedSortedPairs.filter(pair =>
      pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [memoizedSortedPairs, searchQuery]
  );

  // Update the toggle handler
  const handleSortToggle = () => {
    const newValue = !sortByBuySignals;
    setSortByBuySignals(newValue);
    localStorage.setItem('sortByBuySignals', JSON.stringify(newValue));
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4 w-full">
          <div className="flex-1 max-w-sm">
            <Input
              type="search"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
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
        </div>
      </div>
      
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <DragDropContext onDragEnd={onDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="text-left text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50">Symbol</TableHead>
                <TableHead className="text-right text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50">Price</TableHead>
                {timeframes.map((tf) => (
                  <TableHead 
                    key={tf} 
                    className="text-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50"
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
                  {memoizedFilteredPairs.map((pair, index) => (
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
                            "h-10 border-b dark:border-gray-800 hover:bg-gray-800/30 dark:hover:bg-gray-800/70",
                            snapshot.isDragging && "bg-gray-100 dark:bg-gray-800",
                            "cursor-move" // Add cursor indicator
                          )}
                        >
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2">
                              {pair.symbol}
                              {sortByBuySignals && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {countBuySignals(pair)} buys
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-900 dark:text-gray-100">
                            {pair.price?.toFixed(2)}
                          </TableCell>
                          {timeframes.map((tf) => (
                            <TableCell key={tf} className="text-center relative min-w-[100px]">
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
};

export default PairsTable
