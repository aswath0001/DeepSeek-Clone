import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic'; // Needed for Vercel

export async function POST(req) {
  try {
    console.log("🔵 Clerk webhook received");

    // 1. Get and verify headers
    const svixHeaders = {
      "svix-id": headers().get("svix-id"),
      "svix-timestamp": headers().get("svix-timestamp"),
      "svix-signature": headers().get("svix-signature")
    };

    if (!svixHeaders["svix-id"] || !svixHeaders["svix-signature"]) {
      return NextResponse.json(
        { error: "Missing required Svix headers" },
        { status: 400 }
      );
    }

    // 2. Verify webhook
    const payload = await req.json();
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const evt = wh.verify(JSON.stringify(payload), svixHeaders);
    
    console.log(`🔵 Processing event: ${evt.type}`);

    // 3. Connect to DB only for user events
    if (evt.type.startsWith("user.")) {
      await connectDB();

      // Safely extract data with defaults
      const { id } = evt.data;
      const email = evt.data.email_addresses?.[0]?.email_address || null;
      const firstName = evt.data.first_name || "";
      const lastName = evt.data.last_name || "";
      const image = evt.data.image_url || "";

      if (!email) {
        console.warn("⚠️ No email found in payload:", evt.data);
        return NextResponse.json(
          { warning: "No email in payload" },
          { status: 200 }
        );
      }

      const userData = {
        _id: id,
        email,
        name: `${firstName} ${lastName}`.trim(),
        image
      };

      // 4. Handle events
      switch (evt.type) {
        case "user.created":
          await User.create(userData);
          console.log(`🟢 Created user: ${id}`);
          break;
          
        case "user.updated":
          await User.findOneAndUpdate(
            { _id: id },
            userData,
            { upsert: true, new: true }
          );
          break;
          
        case "user.deleted":
          await User.findByIdAndDelete(id);
          break;
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔴 Webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Processing failed" },
      { status: err.message.includes("Missing") ? 400 : 500 }
    );
  }
}

// Required for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, svix-*',
    }
  });
}