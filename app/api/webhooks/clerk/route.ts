import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Get the raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // If secret is set, verify webhook signature
  if (webhookSecret) {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Missing required svix verification headers" },
        { status: 400 }
      );
    }

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Clerk Webhook verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const { type, data } = payload;
  const eventId = "a0000000-0000-0000-0000-000000000001";

  if (type === "user.created") {
    const clerkUserId = data.id;
    const email = data.email_addresses?.[0]?.email_address || null;
    const displayName =
      data.first_name || data.last_name
        ? `${data.first_name || ""} ${data.last_name || ""}`.trim()
        : data.username || "VIBE Attendee";
    const avatarUrl = data.image_url || null;
    const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Create or upsert profile in Supabase
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            clerk_user_id: clerkUserId,
            vibe_id: vibeId,
            display_name: displayName,
            college: "Rotaract District 3192",
          },
          { onConflict: "clerk_user_id" }
        )
        .select()
        .single();

      if (profileErr) {
        console.error("Error creating Supabase profile from Clerk webhook:", profileErr);
      } else if (profile) {
        // 2. Add to event_members
        await supabaseAdmin.from("event_members").upsert(
          {
            event_id: eventId,
            profile_id: profile.id,
            role: "attendee",
            status: "active",
          },
          { onConflict: "event_id,profile_id" }
        );

        // 3. Credit initial starting wallet (500 coins)
        try {
          await supabaseAdmin.rpc("fn_credit_initial_wallet", {
            p_event_id: eventId,
            p_profile_id: profile.id,
            p_initial_amount: 500,
          });
        } catch (rpcErr) {
          console.warn("fn_credit_initial_wallet RPC not available:", rpcErr);
        }
      }
    }

    // Always mirror to mockDb for immediate local access
    let memProfile = Array.from(mockDb.profiles.values()).find(
      (p) => p.clerk_user_id === clerkUserId
    );
    if (!memProfile) {
      memProfile = mockDb.createAttendeeProfile(
        clerkUserId,
        displayName,
        vibeId,
        "District 3192 Delegate",
        "Rotaract Youth Club",
        0
      );
    }

    mockDb.creditInitialWallet(eventId, memProfile.id, 500);

    return NextResponse.json({
      success: true,
      action: "user_created",
      userId: clerkUserId,
    });
  }

  if (type === "user.updated") {
    const clerkUserId = data.id;
    const displayName =
      data.first_name || data.last_name
        ? `${data.first_name || ""} ${data.last_name || ""}`.trim()
        : data.username || "VIBE Attendee";

    if (isUsingLiveSupabase() && supabaseAdmin) {
      await supabaseAdmin
        .from("profiles")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", clerkUserId);
    }

    const memProfile = Array.from(mockDb.profiles.values()).find(
      (p) => p.clerk_user_id === clerkUserId
    );
    if (memProfile) {
      memProfile.display_name = displayName;
    }

    return NextResponse.json({
      success: true,
      action: "user_updated",
      userId: clerkUserId,
    });
  }

  return NextResponse.json({ received: true, type });
}
