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

    const notification = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      included_segments: ['Subscribed Users'], // Send to all subscribed users
      web_push_topic: 'trading-signals',
      chrome_web_icon: '/favicon.ico',
      firefox_icon: '/favicon.ico',
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
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        { error: 'Failed to send notification', details: result },
        { status: response.status }
      );
    }

    console.log('OneSignal notification sent:', result);
    return NextResponse.json({ success: true, id: result.id });

  } catch (error) {
    console.error('OneSignal notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}