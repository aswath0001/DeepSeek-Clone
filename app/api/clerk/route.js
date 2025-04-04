import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic'; // Required for Vercel

export async function POST(req) {
  try {
    console.log("🔵 Webhook received");

    // 1. Get headers and verify webhook
    const headerPayload = headers();
    const svixHeaders = {
      "svix-id": headerPayload.get("svix-id"),
      "svix-timestamp": headerPayload.get("svix-timestamp"),
      "svix-signature": headerPayload.get("svix-signature")
    };

    // Verify required headers exist
    if (!svixHeaders["svix-id"] || !svixHeaders["svix-signature"]) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // 2. Parse and verify payload
    const payload = await req.json();
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const evt = wh.verify(JSON.stringify(payload), svixHeaders);

    console.log(`🔵 Processing event: ${evt.type}`);

    // 3. Only process user events
    if (evt.type.startsWith("user.")) {
      await connectDB();

      // SAFELY extract data with null checks
      const userData = {
        _id: evt.data.id,
        email: evt.data.email_addresses?.[0]?.email_address || null,
        name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim(),
        image: evt.data.image_url || null
      };

      // Validate required fields
      if (!userData.email) {
        console.warn("⚠️ No email in payload:", evt.data);
        return NextResponse.json(
          { warning: "No email provided" },
          { status: 200 }
        );
      }

      // 4. Handle different event types
      switch (evt.type) {
        case "user.created":
          await User.create(userData);
          break;
        case "user.updated":
          await User.findOneAndUpdate(
            { _id: userData._id },
            userData,
            { upsert: true, new: true }
          );
          break;
        case "user.deleted":
          await User.findByIdAndDelete(userData._id);
          break;
      }
      console.log(`🟢 Processed ${evt.type} for user ${userData._id}`);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔴 Webhook error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.includes("Missing") ? 400 : 500 }
    );
  }
}