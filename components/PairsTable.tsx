"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState, useRef } from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  wt1: number;
  wt2: number;
  sma50: number;
  sma200: number;
  price: number;
  signals: {
    cross_over: boolean;
    cross_under: boolean;
    overbought: boolean;
    oversold: boolean;
    price_above_sma50: boolean;
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
    const signal = calculateSignal(data.wt1);
    
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
              sma50: data.sma50,
              sma200: data.sma200
            }
          } as Record<Timeframe, {
            wt1: number;
            wt2: number;
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
  };

  const connectWebSocket = () => {
    setIsLoading(true);
    
    try {
        //const url = 'ws://localhost:8765'
        const url = 'wss://your-trading-bot.fly.dev/ws'

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
         WT1: {indicator.wt1.toFixed(2)}, 
          WT2: {indicator.wt2.toFixed(2)}<br/>
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

  const sortedPairs = sortByBuySignals 
    ? [...pairs].sort((a, b) => {
        const aCount = countBuySignals(a);
        const bCount = countBuySignals(b);
        console.log(`${a.symbol}: ${aCount} buys, ${b.symbol}: ${bCount} buys`);
        return bCount - aCount;
      })
    : pairs;

  // Update the toggle handler
  const handleSortToggle = () => {
    const newValue = !sortByBuySignals;
    setSortByBuySignals(newValue);
    localStorage.setItem('sortByBuySignals', JSON.stringify(newValue));
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
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
      
      <div className="relative overflow-x-auto bg-background dark:bg-gray-900 rounded-lg w-full">
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
                            <TableCell key={tf} className="text-center relative">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center gap-1">
                                  <div className={cn(
                                    "flex items-center gap-1",
                                    getSignalColor(calculateSignal(pair.indicators[tf]?.wt1 ?? 0))
                                  )}>
                                    <div className="w-2 h-2 rounded-full bg-current" />
                                    <span className="text-[8px]">WT1</span>
                                  </div>
                                  <div className={cn(
                                    "flex items-center gap-1",
                                    getSignalColor(calculateSignal(pair.indicators[tf]?.wt2 ?? 0))
                                  )}>
                                    <div className="w-2 h-2 rounded-full bg-current" />
                                    <span className="text-[8px]">WT2</span>
                                  </div>
                                </div>
                                
                                {/* Cross signals */}
                                {getCrossSignal(pair.symbol, tf) && (
                                  <div className={cn(
                                    "transition-opacity duration-200",
                                    "absolute top-0 right-0 m-1"
                                  )}>
                                    {getCrossSignal(pair.symbol, tf)?.type === 'cross_over' ? (
                                      <ArrowUpCircle 
                                        className="w-4 h-4 text-green-500 animate-pulse" 
                                        aria-label="Cross Over"
                                      />
                                    ) : (
                                      <ArrowDownCircle 
                                        className="w-4 h-4 text-red-500 animate-pulse" 
                                        aria-label="Cross Under"
                                      />
                                    )}
                                  </div>
                                )}
                                
                                {(Math.abs(pair.indicators[tf]?.wt1 ?? 0) >= 80 || Math.abs(pair.indicators[tf]?.wt2 ?? 0) >= 80) && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "px-1 py-0 text-[6px] h-4 whitespace-nowrap",
                                      "bg-red-500/20 dark:bg-red-500/20", // Semi-transparent background
                                      "text-red-700 dark:text-red-300", // Text color for light/dark modes
                                      "border-red-500/50 dark:border-red-500/50", // Border color
                                      "animate-[blink_2s_ease-in-out_infinite]" // Animation
                                    )}
                                  >
                                    EXTREME {(pair.indicators[tf]?.wt1 ?? 0) < 0 ? 'BUY' : 'SELL'}
                                  </Badge>
                                )}
                                
                                <span className="text-[8px] text-gray-500 dark:text-gray-400">
                                  {pair.indicators[tf]?.wt1?.toFixed(2) ?? 'N/A'} / {pair.indicators[tf]?.wt2?.toFixed(2) ?? 'N/A'}
                                </span>
                              </div>
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
