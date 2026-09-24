import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// parse .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  if (line && line.includes("=")) {
    const [key, ...vals] = line.split("=");
    env[key.trim()] = vals.join("=").trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const key = env["SUPABASE_SERVICE_ROLE_KEY"];

const s = createClient(url, key);

async function check() {
  const { data: supaProfile, error: supaErr } = await s
    .from("profiles")
    .upsert(
      {
        clerk_user_id: "user_ANOTHER_ONE",
        vibe_id: "VB2026-999",
        display_name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        rotaract_club: "Test Club",
        college: "Test College",
        course_year: "2024",
        instagram_username: "testig",
        username: "testuser",
        bio: "Test bio",
        interests: ["Coding"],
        skills: ["JS"],
        hobbies: ["Reading"],
        city: "Test City",
        avatar_url: "https://example.com/avatar.png",
        profile_completed: true,
        is_discoverable: true,
        xp: 100,
        level_number: 1,
        level_name: "VIBE NEWBIE",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();
  
  if (supaErr) {
    console.error("Upsert Error:", supaErr);
  } else {
    console.log("Upsert Success!");
  }
}

check();
