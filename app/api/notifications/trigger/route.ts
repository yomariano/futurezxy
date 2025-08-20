import { NextRequest, NextResponse } from "next/server";
import {
  sendTradingAlert,
  sendAppNotification,
} from "@/lib/notification-sender";

interface TradingSignal {
  pair: string;
  type: "BUY" | "SELL";
  price?: number;
  rsi?: number;
  wavetrend?: string;
  confidence?: number;
}

interface TriggerNotificationRequest {
  type: "trading_signal" | "app_notification";
  data:
    | TradingSignal
    | {
        title: string;
        body: string;
        url?: string;
        tag?: string;
      };
}

// POST /api/notifications/trigger - Trigger specific types of notifications
export async function POST(request: NextRequest) {
  try {
    const body: TriggerNotificationRequest = await request.json();

    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: "Missing required fields: type and data" },
        { status: 400 }
      );
    }

    switch (body.type) {
      case "trading_signal":
        await handleTradingSignal(body.data as TradingSignal);
        break;

      case "app_notification":
        await handleAppNotification(body.data as any);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Notification triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering notification:", error);
    return NextResponse.json(
      { error: "Failed to trigger notification" },
      { status: 500 }
    );
  }
}

async function handleTradingSignal(signal: TradingSignal) {
  if (!signal.pair || !signal.type) {
    throw new Error("Trading signal must include pair and type");
  }

  await sendTradingAlert(signal);
}

async function handleAppNotification(data: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  if (!data.title || !data.body) {
    throw new Error("App notification must include title and body");
  }

  await sendAppNotification(data.title, data.body, {
    url: data.url,
    tag: data.tag,
  });
}

// GET /api/notifications/trigger/test - Send test notifications
export async function GET() {
  try {
    // Send a test trading signal
    await sendTradingAlert({
      pair: "BTC/USDT",
      type: "BUY",
      price: 45000,
      rsi: 30,
      wavetrend: "oversold",
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}



