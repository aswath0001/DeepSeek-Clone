// app/api/clerk/route.js
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

// ================== FIX 1: Force Dynamic ==================
export const dynamic = 'force-dynamic';

// ================== FIX 2: Handle POST ==================
export async function POST(req) {
  try {
    console.log("🟢 Webhook received");

    // 1. Verify headers
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

    console.log(`🟢 Processing: ${evt.type}`);

    // 3. Handle user events
    if (evt.type.startsWith("user.")) {
      await connectDB();

      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn("⚠️ No email found");
        return NextResponse.json({ warning: "No email" }, { status: 200 });
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
    console.error("🔴 Error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// ================== FIX 3: Add CORS Support ==================
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