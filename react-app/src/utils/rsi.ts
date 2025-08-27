interface Candle {
  high: number;
  low: number;
  close: number;
  timestamp?: number;
}

interface RSIResult {
  rsi: number;
  avgGain: number;
  avgLoss: number;
}

/**
 * Calculates price changes between consecutive candles
 * @param candles Array of candles
 * @returns Array of price changes
 */
const calculatePriceChanges = (candles: Candle[]): number[] => {
  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }
  return changes;
};

/**
 * Calculates initial average gain and loss
 * @param changes Array of price changes
 * @param period RSI period
 * @returns Object containing initial average gain and loss
 */
const calculateInitialAverages = (changes: number[], period: number) => {
  let gainSum = 0;
  let lossSum = 0;

  changes.slice(0, period).forEach(change => {
    if (change > 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  });

  return {
    avgGain: gainSum / period,
    avgLoss: lossSum / period
  };
};

/**
 * Calculates RSI value
 * @param candles Array of candles
 * @param period RSI period (default: 14)
 * @returns RSI result object
 */
export const calculateRSI = (
  candles: Candle[],
  period: number = 14
): RSIResult | null => {
  // Need at least period + 1 candles to calculate RSI
  if (candles.length < period + 1) {
    console.log('Not enough candles to calculate RSI', {
      required: period + 1,
      received: candles.length
    });
    return null;
  }

  const changes = calculatePriceChanges(candles);
  console.log('Price changes (last 5):', changes.slice(-5));

  // Calculate initial averages
  const { avgGain, avgLoss } = calculateInitialAverages(changes, period);
  console.log('Initial averages:', { avgGain, avgLoss });

  // Use Wilder's smoothing method for subsequent values
  let smoothedGain = avgGain;
  let smoothedLoss = avgLoss;

  // Calculate final RSI value using the most recent data
  const currentChange = changes[changes.length - 1];
  
  // Update smoothed gain and loss
  smoothedGain = (smoothedGain * (period - 1) + (currentChange > 0 ? currentChange : 0)) / period;
  smoothedLoss = (smoothedLoss * (period - 1) + (currentChange < 0 ? Math.abs(currentChange) : 0)) / period;

  console.log('Final smoothed values:', {
    smoothedGain,
    smoothedLoss
  });

  // Calculate RSI
  const rs = smoothedGain / smoothedLoss;
  const rsi = 100 - (100 / (1 + rs));

  console.log('Calculated RSI:', rsi);

  return {
    rsi,
    avgGain: smoothedGain,
    avgLoss: smoothedLoss
  };
};

/**
 * Generates trading signal based on RSI values
 * @param rsi Current RSI value
 * @param overbought Overbought threshold (default: 70)
 * @param oversold Oversold threshold (default: 30)
 * @returns Trading signal
 */
export const generateRSISignal = (
  rsi: number,
  overbought: number = 70,
  oversold: number = 30
): 'buy' | 'sell' | 'neutral' => {
  console.log('Generating RSI signal:', {
    rsi,
    overbought,
    oversold
  });

  if (rsi >= overbought) {
    return 'sell';
  } else if (rsi <= oversold) {
    return 'buy';
  }
  return 'neutral';
};

/**
 * Updates RSI calculation with new candle
 * @param currentCandles Existing candle data
 * @param newCandle New candle to add
 * @param maxCandles Maximum number of candles to maintain
 * @returns Updated candle array
 */
export const updateRSICandles = (
  currentCandles: Candle[],
  newCandle: Candle,
  maxCandles: number = 100
): Candle[] => {
  console.log('Updating RSI candles:', {
    currentCount: currentCandles.length,
    maxCandles,
    newCandle
  });

  const updatedCandles = [...currentCandles, newCandle];
  if (updatedCandles.length > maxCandles) {
    return updatedCandles.slice(-maxCandles);
  }
  return updatedCandles;
};

// Example usage:
/*
const candles: Candle[] = [
  { high: 100, low: 95, close: 98 },
  { high: 102, low: 97, close: 100 },
  // ... more candles (at least 15 for default period)
];

const rsiResult = calculateRSI(candles);
if (rsiResult) {
  const signal = generateRSISignal(rsiResult.rsi);
  console.log('RSI Signal:', signal);
}
*/
