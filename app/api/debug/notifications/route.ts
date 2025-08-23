import { NextRequest, NextResponse } from "next/server";

// GET /api/debug/notifications - Debug push notification system
export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      vapidKeys: {},
      subscriptions: {},
      testResult: {},
    };

    // Check VAPID keys
    results.vapidKeys = {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Set' : 'Missing',
      privateKey: process.env.VAPID_PRIVATE_KEY ? 'Set' : 'Missing',
      email: process.env.VAPID_EMAIL || 'Missing',
    };

    // Check subscriptions
    try {
      const subscriptionsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/subscribe`;
      const subscriptionsResponse = await fetch(subscriptionsUrl, { method: 'GET' });
      
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        results.subscriptions = {
          status: 'OK',
          count: subscriptionsData.count || 0,
          success: subscriptionsData.success || false,
        };
      } else {
        results.subscriptions = {
          status: 'ERROR',
          httpStatus: subscriptionsResponse.status,
          error: await subscriptionsResponse.text(),
        };
      }
    } catch (error) {
      results.subscriptions = {
        status: 'FETCH_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test notification trigger
    try {
      const testUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`;
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Debug Test Notification',
          body: 'This is a debug test from the debug endpoint',
          tag: 'debug-test',
          url: '/signals',
        }),
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        results.testResult = {
          status: 'OK',
          response: testData,
        };
      } else {
        results.testResult = {
          status: 'ERROR',
          httpStatus: testResponse.status,
          error: await testResponse.text(),
        };
      }
    } catch (error) {
      results.testResult = {
        status: 'FETCH_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json({
      success: true,
      debug: results,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}