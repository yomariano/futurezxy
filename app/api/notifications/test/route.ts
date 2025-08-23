import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications/test - Send a test push notification
export async function GET() {
  try {
    console.log('Test notification endpoint called');
    
    // Send a test notification
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Push Notification 🔔',
        body: 'This is a test push notification from FutureZXY. If you see this, push notifications are working!',
        tag: 'test-notification',
        url: '/signals',
        data: {
          test: true,
          timestamp: Date.now(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to trigger test notification:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Test notification result:', result);

    return NextResponse.json({
      success: true,
      message: "Test push notification sent successfully",
      result,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { 
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications/test - Send a custom test notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body: message,
        tag: 'custom-test',
        url: '/signals',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Custom test notification sent successfully",
      result,
    });
  } catch (error) {
    console.error("Error sending custom test notification:", error);
    return NextResponse.json(
      { error: "Failed to send custom test notification" },
      { status: 500 }
    );
  }
}