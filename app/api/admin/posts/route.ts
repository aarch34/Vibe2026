import { NextResponse } from "next/server";
import { supabaseAdmin, isUsingLiveSupabase, mockDb } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isUsingLiveSupabase()) {
    const posts = Array.from(mockDb.posts.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return NextResponse.json({ success: true, posts });
  }

  try {
    const { data: posts, error } = await supabaseAdmin!
      .from("posts")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isUsingLiveSupabase()) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });
    }

    const { error } = await supabaseAdmin!
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
