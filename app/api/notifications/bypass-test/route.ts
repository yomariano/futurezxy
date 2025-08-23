import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint with no auth requirements
export async function GET() {
  try {
    console.log('🧪 Bypass test endpoint called - no auth required');
    
    // Test basic notification functionality
    const testResults = {
      timestamp: new Date().toISOString(),
      authBypassStatus: 'SUCCESS - No authentication required',
      vapidStatus: {
        publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Present' : 'Missing',
        privateKey: process.env.VAPID_PRIVATE_KEY ? 'Present' : 'Missing', 
        email: process.env.VAPID_EMAIL || 'Missing',
      },
      testNotificationTrigger: null as any,
    };

    // Try to trigger a test notification without any auth
    try {
      const testUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`;
      console.log('🚀 Testing notification trigger at:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Auth Bypass Test 🚫🔐',
          body: 'This test notification was sent without authentication - bypassing all auth checks.',
          tag: 'bypass-test',
          url: '/signals',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        testResults.testNotificationTrigger = {
          status: 'SUCCESS',
          message: 'Notification sent without auth',
          response: result,
        };
        console.log('✅ Auth bypass notification test successful');
      } else {
        const errorText = await response.text();
        testResults.testNotificationTrigger = {
          status: 'FAILED',
          httpStatus: response.status,
          error: errorText,
        };
        console.log('❌ Auth bypass notification test failed:', response.status);
      }
    } catch (error) {
      testResults.testNotificationTrigger = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      console.log('🚨 Auth bypass test error:', error);
    }

    return NextResponse.json({
      success: true,
      message: '🚫🔐 Auth bypass test completed - no authentication required for push notifications',
      results: testResults,
    });
  } catch (error) {
    console.error("❌ Auth bypass test endpoint error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Auth bypass test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for custom test messages without auth
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    console.log('📨 Custom bypass test message:', message);
    
    // Send custom test notification without any auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Custom Bypass Test 🔓',
        body: message || 'Custom test message sent without authentication',
        tag: 'custom-bypass',
        url: '/signals',
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Custom test notification sent without auth' : 'Custom test failed',
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}