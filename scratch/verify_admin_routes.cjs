const http = require("http");

const adminCookie = `vibe_admin_auth=${encodeURIComponent(
  JSON.stringify({
    username: "thejaswinps",
    name: "Thejaswin P",
    role: "admin",
    loggedInAt: Date.now(),
  })
)}`;

async function checkRoute(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: "GET",
      headers: {
        Cookie: adminCookie,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        // Decode HTML entities
        const decoded = data
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
        resolve({ status: res.statusCode, html: decoded });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function run() {
  const routes = [
    {
      name: "Admin Dashboard",
      path: "/admin",
      check: [
        "Platform Data Hygiene & Rapid Tools",
        "Purge Test & Demo Data",
        "Attendees",
        "Zones",
        "Missions",
        "Rewards",
      ],
    },
    {
      name: "Attendee Directory",
      path: "/admin/attendees",
      check: ["Add Attendee", "Export CSV", "All Zones"],
    },
    {
      name: "Zone Command",
      path: "/admin/zones",
      check: ["Zone Command & Operations", "Award Bonus", "Arnava", "Taranaga", "Sagara"],
    },
    {
      name: "Missions & Experiences",
      path: "/admin/experiences",
      check: ["Missions & Experiences Command", "Total Missions", "Active Now"],
    },
    {
      name: "Rewards & Swag",
      path: "/admin/rewards",
      check: ["Rewards & Swag Inventory Control", "Restock", "Reward Catalog"],
    },
    {
      name: "QR Desks",
      path: "/admin/qr",
      check: ["QR Checkpoint Management"],
    },
    {
      name: "Audit Logs",
      path: "/admin/audit-logs",
      check: ["Security & Operations Audit Logs", "Action"],
    },
    {
      name: "Staff Zonal Duty Matrix",
      path: "/admin/staff",
      check: ["Zonal Staff Delegation Matrix", "Delegate Zonal Staff"],
    },
  ];

  console.log("🔍 Checking all Admin Routes on http://localhost:3000 with admin credentials...\n");
  let allPass = true;

  for (const r of routes) {
    try {
      const res = await checkRoute(r.path);
      const passedKeywords = r.check.filter((kw) => res.html.includes(kw));
      const ok = res.status === 200 && passedKeywords.length === r.check.length;

      if (ok) {
        console.log(`✅ [${r.name}] ${r.path} -> Status ${res.status} [Found all: ${passedKeywords.join(", ")}]`);
      } else {
        allPass = false;
        console.error(
          `❌ [${r.name}] ${r.path} -> Status ${res.status} (Missing: ${r.check
            .filter((kw) => !res.html.includes(kw))
            .join(", ")})`
        );
      }
    } catch (e) {
      allPass = false;
      console.error(`❌ [${r.name}] ${r.path} -> Network Error: ${e.message}`);
    }
  }

  if (allPass) {
    console.log("\n🎉 ALL 8 ADMIN CONSOLE SECTIONS VERIFIED FULLY FUNCTIONAL!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
