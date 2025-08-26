import { NextRequest, NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = "f88d5ae4-e766-461f-bf00-90707c1b850e";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

export async function POST(req: NextRequest) {
  if (!ONESIGNAL_API_KEY) {
    return NextResponse.json(
      { error: 'OneSignal API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { title, message, data } = await req.json();

    // Log the trading signal for debugging
    console.log('📊 Trading signal received:', {
      title,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      signalType: data?.signalType,
      symbol: data?.symbol,
      timeframe: data?.timeframe,
      priority: data?.priority
    });

    // Enhanced notification with trading-specific settings
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        source: 'trading-bot',
        timestamp: Date.now(),
        url: '/signals' // Direct users to signals page
      },
      included_segments: ['Subscribed Users'], // Send to all subscribed users
      
      // Trading signal specific settings
      web_push_topic: 'trading-signals',
      chrome_web_icon: '/favicon.ico',
      firefox_icon: '/favicon.ico',
      
      // Priority based on signal type
      priority: data?.priority === 'highest' ? 10 : 
                data?.priority === 'high' ? 8 : 
                data?.priority === 'medium' ? 5 : 3,
      
      // Sound and visual settings
      android_sound: 'default',
      ios_sound: 'default',
      
      // Time to live (24 hours for trading signals)
      ttl: 86400,
      
      // Additional web settings
      web_buttons: [
        {
          id: 'view-signals',
          text: 'View Signals',
          url: '/signals'
        }
      ]
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ OneSignal API error:', result);
      return NextResponse.json(
        { error: 'Failed to send trading signal notification', details: result },
        { status: response.status }
      );
    }

    console.log('✅ Trading signal notification sent successfully:', {
      id: result.id,
      recipients: result.recipients || 'Unknown',
      signalType: data?.signalType,
      symbol: data?.symbol
    });

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      recipients: result.recipients,
      signalType: data?.signalType,
      message: 'Trading signal notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Trading signal notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: 'trading-signal',
    oneSignalConfigured: !!ONESIGNAL_API_KEY,
    timestamp: new Date().toISOString()
  });
}