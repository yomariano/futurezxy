interface Candle {
  high: number;
  low: number;
  close: number;
  timestamp?: number;
}

interface WaveTrendResult {
  wt1: number[];
  wt2: number[];
}

interface WaveTrendSettings {
  channelLength: number;  // n1
  averageLength: number;  // n2
  overbought1: number;
  overbought2: number;
  oversold1: number;
  oversold2: number;
}

const DEFAULT_SETTINGS: WaveTrendSettings = {
  channelLength: 10,
  averageLength: 21,
  overbought1: 60,
  overbought2: 53,
  oversold1: -60,
  oversold2: -53
};

/**
 * Calculates HLC3 (High, Low, Close average)
 */
export const hlc3 = (high: number, low: number, close: number): number => {
  return (high + low + close) / 3;
};

/**
 * Calculates Exponential Moving Average
 * @param values Array of values to calculate EMA
 * @param period EMA period
 * @returns Array of EMA values
 */
export const ema = (values: number[], period: number): number[] => {
  if (values.length < period) return [];

  const alpha = 2 / (period + 1);
  const emaValues: number[] = [];
  
  // Initialize EMA with SMA
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  emaValues.push(ema);

  // Calculate EMA for remaining values
  for (let i = period; i < values.length; i++) {
    ema = (values[i] * alpha) + (ema * (1 - alpha));
    emaValues.push(ema);
  }

  return emaValues;
};

/**
 * Calculates Simple Moving Average
 * @param values Array of values to calculate SMA
 * @param period SMA period
 * @returns Array of SMA values
 */
export const sma = (values: number[], period: number): number[] => {
  if (values.length < period) return [];
  
  const smaValues: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    smaValues.push(sum / period);
  }
  return smaValues;
};

/**
 * Calculates Wave Trend indicator
 * @param candles Array of OHLC candles
 * @param settings Wave Trend settings
 * @returns Object containing wt1 and wt2 arrays
 */
export const calculateWT = (
  candles: Candle[],
  settings: WaveTrendSettings = DEFAULT_SETTINGS
): WaveTrendResult => {
  const { channelLength: n1, averageLength: n2 } = settings;
  const minCandles = Math.max(n1, n2) + 4;
  
  if (candles.length < minCandles) {
    console.log(`Not enough candles for Wave Trend calculation. Need ${minCandles}, got ${candles.length}`);
    return { wt1: [0], wt2: [0] }; // Return default values instead of empty arrays
  }

  // Step 1: Calculate AP (Average Price using HLC3)
  const ap = candles.map(candle => hlc3(candle.high, candle.low, candle.close));
  
  // Step 2: Calculate ESA (EMA of AP)
  const esa = ema(ap, n1);
  if (esa.length === 0) {
    console.log('ESA calculation failed');
    return { wt1: [0], wt2: [0] };
  }

  // Step 3: Calculate absolute difference and its EMA
  const apEsaDiff = ap.slice(n1 - 1).map((apValue, i) => 
    Math.abs(apValue - esa[i])
  );
  
  const d = ema(apEsaDiff, n1);
  if (d.length === 0) {
    console.log('D calculation failed');
    return { wt1: [0], wt2: [0] };
  }

  // Step 4: Calculate CI (Momentum)
  const ci = ap.slice(n1 - 1).map((apValue, i) => {
    if (!d[i] || d[i] === 0) return 0;
    return (apValue - esa[i]) / (0.015 * d[i]);
  });

  // Step 5: Calculate TCCI (EMA of CI)
  const wt1Full = ema(ci, n2);
  if (wt1Full.length === 0) {
    console.log('WT1 calculation failed');
    return { wt1: [0], wt2: [0] };
  }

  // Step 6: Calculate wt2 (Signal line)
  const wt2Full = sma(wt1Full, 4);
  if (wt2Full.length === 0) {
    console.log('WT2 calculation failed');
    return { wt1: [0], wt2: [0] };
  }

  const lastWT1 = wt1Full[wt1Full.length - 1];
  const lastWT2 = wt2Full[wt2Full.length - 1];

  // Check for NaN values
  if (isNaN(lastWT1) || isNaN(lastWT2)) {
    console.log('NaN values detected:', {
      lastWT1,
      lastWT2,
      apLength: ap.length,
      esaLength: esa.length,
      dLength: d.length,
      ciLength: ci.length,
      wt1FullLength: wt1Full.length,
      wt2FullLength: wt2Full.length
    });
    return { wt1: [0], wt2: [0] };
  }

  return { 
    wt1: [lastWT1], 
    wt2: [lastWT2] 
  };
};

/**
 * Generates trading signal based on Wave Trend values
 * @param wt1 Current WT1 value
 * @param wt2 Current WT2 value
 * @param prevWT1 Previous WT1 value
 * @param prevWT2 Previous WT2 value
 * @param settings Wave Trend settings
 * @returns Trading signal ('buy' | 'sell' | 'neutral')
 */
export const generateWTSignal = (
  wt1: number,
  wt2: number,
  prevWT1: number,
  prevWT2: number,
  settings: WaveTrendSettings = DEFAULT_SETTINGS
): 'buy' | 'sell' | 'neutral' => {
  const { oversold2, overbought2 } = settings;

  // Cross-over detection with more precise comparison
  const crossUp = prevWT1 <= prevWT2 && wt1 > wt2;
  const crossDown = prevWT1 >= prevWT2 && wt1 < wt2;

  if (crossUp && wt1 < oversold2) {
    return 'buy';
  } else if (crossDown && wt1 > overbought2) {
    return 'sell';
  }

  return 'neutral';
};

/**
 * Updates Wave Trend calculations with new candle data
 * @param currentCandles Existing candle data
 * @param newCandle New candle to add
 * @param maxCandles Maximum number of candles to maintain
 * @returns Updated candle array
 */
export const updateWTCandles = (
  currentCandles: Candle[],
  newCandle: Candle,
  maxCandles: number = 100
): Candle[] => {
  // Ensure maxCandles is at least the minimum required for Wave Trend
  const minRequired = Math.max(9, 12) + 9 + 4; // 25 with default values
  const actualMaxCandles = Math.max(maxCandles, minRequired);
  
  const updatedCandles = [...currentCandles, newCandle];
  if (updatedCandles.length > actualMaxCandles) {
    return updatedCandles.slice(-actualMaxCandles);
  }
  return updatedCandles;
};

// Example usage:
/*
const candles: Candle[] = [
  { high: 100, low: 95, close: 98 },
  { high: 102, low: 97, close: 100 },
  // ... more candles
];

const { wt1, wt2 } = calculateWT(candles);
const signal = generateWTSignal(
  wt1[wt1.length - 1],
  wt2[wt2.length - 1],
  wt1[wt1.length - 2],
  wt2[wt2.length - 2]
);
*/
