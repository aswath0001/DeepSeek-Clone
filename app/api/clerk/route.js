import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connectDB();
        
        const wh = new Webhook(process.env.SIGNING_SECRET);
        const headerPayLoad = await headers();
        const svixHeaders = {
            "svix-id": headerPayLoad.get("svix-id"),
            "svix-timestamp": headerPayLoad.get("svix-timestamp"),
            "svix-signature": headerPayLoad.get("svix-signature")
        };

        // Get the payload and verify it
        const payload = await req.json();
        const body = JSON.stringify(payload);
        const { data, type } = wh.verify(body, svixHeaders);

        // Prepare the user data to be saved in the database
        const userData = {
            _id: data.id,
            email: data.email_addresses[0].email_address, // Fixed this line
            name: `${data.first_name} ${data.last_name}`,
            image: data.image_url,
        };

        switch(type) {
            case 'user.created':
                await User.create(userData);
                break;
            case 'user.updated':
                await User.findByIdAndUpdate(data.id, userData);
                break;
            case 'user.deleted':
                await User.findByIdAndDelete(data.id);
                break;
            default:
                break;
        }

        return NextResponse.json({ message: "Event Received" }, { status: 200 });
        
    } catch (err) {
        console.error("Webhook error:", err);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
}