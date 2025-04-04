// app/api/clerk/route.js
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    console.log("🟢 Webhook received");
    
    // Verify headers
    const svixHeaders = {
      "svix-id": headers().get("svix-id"),
      "svix-timestamp": headers().get("svix-timestamp"),
      "svix-signature": headers().get("svix-signature")
    };

    const payload = await req.json();
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const evt = wh.verify(JSON.stringify(payload), svixHeaders);

    console.log(`🟢 Processed ${evt.type} event`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔴 Webhook error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, svix-*"
    }
  });
}