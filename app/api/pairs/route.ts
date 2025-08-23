import { NextRequest, NextResponse } from 'next/server';

interface AddPairRequest {
  symbol: string;
  exchange?: string;
  enabled?: boolean;
}

interface TradingPair {
  symbol: string;
  exchange: string;
  price: number;
  change24h: number;
  volume24h: number;
  enabled: boolean;
  indicators: Record<string, any>;
  signals: Record<string, string>;
  lastUpdate: string;
}

// In-memory storage for pairs (in production, use a database)
let pairs: TradingPair[] = [];

// Initialize with some default pairs if empty
if (pairs.length === 0) {
  pairs = [
    {
      symbol: 'BTCUSDT',
      exchange: 'mexc',
      price: 0,
      change24h: 0,
      volume24h: 0,
      enabled: true,
      indicators: {},
      signals: {},
      lastUpdate: new Date().toISOString(),
    },
    {
      symbol: 'ETHUSDT',
      exchange: 'mexc',
      price: 0,
      change24h: 0,
      volume24h: 0,
      enabled: true,
      indicators: {},
      signals: {},
      lastUpdate: new Date().toISOString(),
    },
  ];
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      pairs: pairs.filter(p => p.enabled),
      count: pairs.filter(p => p.enabled).length,
    });
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pairs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AddPairRequest = await request.json();
    
    if (!body.symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Normalize symbol (remove any special characters and convert to uppercase)
    let normalizedSymbol = body.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Add underscore before USDT if not present (for MEXC format)
    if (normalizedSymbol.endsWith('USDT') && !normalizedSymbol.includes('_')) {
      normalizedSymbol = normalizedSymbol.replace('USDT', '_USDT');
    }
    // Add underscore before other common quote currencies
    if (normalizedSymbol.endsWith('BTC') && !normalizedSymbol.includes('_')) {
      normalizedSymbol = normalizedSymbol.replace('BTC', '_BTC');
    }
    if (normalizedSymbol.endsWith('ETH') && !normalizedSymbol.includes('_')) {
      normalizedSymbol = normalizedSymbol.replace('ETH', '_ETH');
    }
    
    if (normalizedSymbol.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid symbol format' },
        { status: 400 }
      );
    }

    // Check if pair already exists
    const existingPair = pairs.find(p => p.symbol === normalizedSymbol);
    if (existingPair) {
      if (!existingPair.enabled) {
        // Re-enable if it was disabled
        existingPair.enabled = true;
        existingPair.lastUpdate = new Date().toISOString();
        return NextResponse.json({
          success: true,
          message: 'Pair re-enabled',
          pair: existingPair,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Pair already exists and is enabled' },
          { status: 409 }
        );
      }
    }

    // Create new pair (only MEXC exchange supported)
    const newPair: TradingPair = {
      symbol: normalizedSymbol,
      exchange: 'mexc', // Fixed to MEXC only
      price: 0,
      change24h: 0,
      volume24h: 0,
      enabled: body.enabled !== false, // Default to true
      indicators: {},
      signals: {},
      lastUpdate: new Date().toISOString(),
    };

    pairs.push(newPair);

    return NextResponse.json({
      success: true,
      message: 'Pair added successfully',
      pair: newPair,
    });

  } catch (error) {
    console.error('Error adding pair:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add pair' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const pairIndex = pairs.findIndex(p => p.symbol === symbol.toUpperCase());
    if (pairIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Pair not found' },
        { status: 404 }
      );
    }

    // Soft delete by disabling
    pairs[pairIndex].enabled = false;
    pairs[pairIndex].lastUpdate = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Pair disabled successfully',
    });

  } catch (error) {
    console.error('Error deleting pair:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete pair' },
      { status: 500 }
    );
  }
}