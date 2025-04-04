import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic'; // Required for Vercel

export async function POST(req) {
  try {
    console.log("🔵 Webhook received");

    // 1. Verify webhook headers
    const svixHeaders = {
      "svix-id": headers().get("svix-id"),
      "svix-timestamp": headers().get("svix-timestamp"),
      "svix-signature": headers().get("svix-signature"),
    };

    if (!svixHeaders["svix-id"] || !svixHeaders["svix-signature"]) {
      return NextResponse.json(
        { error: "Missing Svix headers" },
        { status: 400 }
      );
    }

    // 2. Verify payload
    const payload = await req.json();
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const evt = wh.verify(JSON.stringify(payload), svixHeaders);

    console.log(`🔵 Processing event: ${evt.type}`);

    // 3. Handle user events
    if (evt.type.startsWith("user.")) {
      await connectDB();

      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn("⚠️ No email found in payload");
        return NextResponse.json(
          { warning: "No email provided" },
          { status: 200 }
        );
      }

      const userData = {
        _id: id,
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || null,
      };

      switch (evt.type) {
        case "user.created":
          await User.create(userData);
          break;
        case "user.updated":
          await User.findOneAndUpdate({ _id: id }, userData, { upsert: true });
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
      { error: err.message },
      { status: 500 }
    );
  }
}

// Required for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, svix-*",
      },
    }
  );
}