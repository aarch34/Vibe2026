/**
 * purge-clerk-users.mjs
 * Deletes ALL users from the Clerk account.
 * Run once to clear test registrations:
 *   node scripts/purge-clerk-users.mjs
 */

import https from "https";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_Wucnj0p7m5d9132CEuuVeYPYm1AYJKuO5476XYUBH0";

function clerkRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.clerk.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("🔍 Fetching all Clerk users...\n");
  let allUsers = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await clerkRequest("GET", `/v1/users?limit=${limit}&offset=${offset}`);
    if (!Array.isArray(res.body)) {
      console.error("❌ Unexpected Clerk response:", res.status, res.body);
      process.exit(1);
    }
    allUsers = allUsers.concat(res.body);
    if (res.body.length < limit) break;
    offset += limit;
  }

  console.log(`👥 Found ${allUsers.length} user(s) in Clerk.\n`);

  if (allUsers.length === 0) {
    console.log("✅ No users to delete. Clerk is already clean.");
    return;
  }

  let deleted = 0;
  let failed = 0;

  for (const user of allUsers) {
    const email = user.email_addresses?.[0]?.email_address || "(no email)";
    process.stdout.write(`  Deleting ${user.id} (${email})... `);

    const res = await clerkRequest("DELETE", `/v1/users/${user.id}`);
    if (res.status === 200 || res.status === 204) {
      console.log("✅");
      deleted++;
    } else {
      console.log(`❌ HTTP ${res.status}`);
      failed++;
    }

    // Respect Clerk rate limit (~20 req/s → 60ms gap)
    await sleep(60);
  }

  console.log(`\n🏁 Done. Deleted: ${deleted} | Failed: ${failed}`);
  if (failed > 0) console.log("⚠️  Some deletions failed — re-run the script to retry.");
  console.log("\n📋 Next step: Run the Supabase cleanup SQL in the Dashboard.");
}

main().catch(console.error);
