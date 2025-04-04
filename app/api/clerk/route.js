import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    // 1. Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // 2. Get headers and verify webhook
    const headerPayload = headers();
    const svixHeaders = {
      "svix-id": headerPayload.get("svix-id"),
      "svix-timestamp": headerPayload.get("svix-timestamp"),
      "svix-signature": headerPayload.get("svix-signature"),
    };

    // 3. Verify webhook signature
    const payload = await req.json();
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const evt = wh.verify(JSON.stringify(payload), svixHeaders);
    
    console.log("🔵 Webhook verified:", evt.type);

    // 4. Handle the event
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    // Safely get email
    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error("No email found in webhook payload");
    }

    const userData = {
      _id: id,
      email,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      image: image_url,
    };

    switch (evt.type) {
      case "user.created":
        await User.create(userData);
        console.log("🟢 User created:", id);
        break;
        
      case "user.updated":
        await User.findByIdAndUpdate(id, userData);
        break;
        
      case "user.deleted":
        await User.findByIdAndDelete(id);
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("🔴 Webhook error:", err.message);
    return NextResponse.json(
      { error: err.message || "Webhook processing failed" },
      { status: 400 }
    );
  }
}