import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Send message to OpenClaw gateway
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "ws://localhost:18789";
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

    if (!gatewayToken) {
      console.error("OPENCLAW_GATEWAY_TOKEN not configured");
      return NextResponse.json(
        { error: "Gateway not configured" },
        { status: 500 }
      );
    }

    // For now, return a placeholder response
    // TODO: Implement actual WebSocket connection to OpenClaw gateway
    // This requires setting up a persistent WebSocket connection or using HTTP API

    return NextResponse.json({
      response: `I received your message: "${message}". WebSocket connection to gateway is being implemented.`,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
