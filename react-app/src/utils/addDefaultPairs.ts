// Utility to add default trading pairs

export const DEFAULT_PAIRS = [
  'MKRUSDT',
  'DOGEUSDT',
  'INJUSDT',
  'PEPEUSDT',
  'XRPUSDT',
  'TAOUSDT',
  'SOLUSDT',
  'XLMUSDT',
  'BNBUSDT',
  'ENAUSDT',
  'ADAUSDT',
  'AVAXUSDT'
];

export async function addDefaultPairs(): Promise<{
  success: boolean;
  added: string[];
  failed: string[];
  errors: Record<string, string>;
}> {
  const added: string[] = [];
  const failed: string[] = [];
  const errors: Record<string, string> = {};

  for (const symbol of DEFAULT_PAIRS) {
    try {
      console.log(`Adding pair: ${symbol}`);
      
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          exchange: 'mexc',
          enabled: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        added.push(symbol);
        console.log(`✅ Successfully added: ${symbol}`);
      } else {
        failed.push(symbol);
        errors[symbol] = data.error || 'Unknown error';
        console.error(`❌ Failed to add ${symbol}:`, data.error);
      }
    } catch (error) {
      failed.push(symbol);
      errors[symbol] = error instanceof Error ? error.message : 'Network error';
      console.error(`❌ Error adding ${symbol}:`, error);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    success: failed.length === 0,
    added,
    failed,
    errors
  };
}

// Function to check which pairs are already added
export async function checkExistingPairs(): Promise<string[]> {
  try {
    const response = await fetch('/api/pairs');
    const data = await response.json();
    
    if (data.success && data.pairs) {
      return data.pairs.map((pair: any) => pair.symbol);
    }
  } catch (error) {
    console.error('Error fetching existing pairs:', error);
  }
  
  return [];
}

// Add only missing pairs
export async function addMissingDefaultPairs(): Promise<{
  success: boolean;
  added: string[];
  skipped: string[];
  failed: string[];
  errors: Record<string, string>;
}> {
  const existingPairs = await checkExistingPairs();
  const existingSet = new Set(existingPairs.map(p => p.toUpperCase()));
  
  const added: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const errors: Record<string, string> = {};

  for (const symbol of DEFAULT_PAIRS) {
    if (existingSet.has(symbol.toUpperCase())) {
      skipped.push(symbol);
      console.log(`⏭️ Skipping ${symbol} (already exists)`);
      continue;
    }

    try {
      console.log(`Adding pair: ${symbol}`);
      
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          exchange: 'mexc',
          enabled: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        added.push(symbol);
        console.log(`✅ Successfully added: ${symbol}`);
      } else {
        failed.push(symbol);
        errors[symbol] = data.error || 'Unknown error';
        console.error(`❌ Failed to add ${symbol}:`, data.error);
      }
    } catch (error) {
      failed.push(symbol);
      errors[symbol] = error instanceof Error ? error.message : 'Network error';
      console.error(`❌ Error adding ${symbol}:`, error);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    success: failed.length === 0,
    added,
    skipped,
    failed,
    errors
  };
}