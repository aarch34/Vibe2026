import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  if (line && line.includes("=")) {
    const [key, ...vals] = line.split("=");
    env[key.trim()] = vals.join("=").trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const s = createClient(env["NEXT_PUBLIC_SUPABASE_URL"]!, env["SUPABASE_SERVICE_ROLE_KEY"]!);

async function check() {
  const { error } = await s
    .from("profiles")
    .select("*")
    .or(`clerk_user_id.eq.foo,email.eq.`)
    .maybeSingle();
  console.log("Query error:", error);
}

check();
