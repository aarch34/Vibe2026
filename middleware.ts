import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const secretKey = process.env.CLERK_SECRET_KEY || "";

const isClerkReady =
  publishableKey &&
  !publishableKey.includes("placeholder") &&
  secretKey &&
  !secretKey.includes("placeholder");

let clerkHandler: any = null;

if (isClerkReady) {
  try {
    const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");

    const isPublicRoute = createRouteMatcher([
      "/",
      "/sign-in(.*)",
      "/sign-up(.*)",
      "/register(.*)",
      "/api/webhooks(.*)",
      "/staff/login(.*)",
      "/admin/login(.*)",
      "/manifest.json",
      "/favicon.ico",
      "/apple-touch-icon.png",
    ]);

    const isAppRoute = createRouteMatcher(["/app(.*)"]);
    const isStaffRoute = createRouteMatcher(["/staff(.*)"]);
    const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

    clerkHandler = clerkMiddleware((auth: any, req: any) => {
      // 1. Allow public routes
      if (isPublicRoute(req)) {
        return NextResponse.next();
      }

      // 2. Protect Admin Console (/admin/*)
      if (isAdminRoute(req)) {
        const adminCookie =
          req.cookies.get("vibe_admin_auth")?.value ||
          req.cookies.get("vibe_admin_token")?.value;
        const staffCookie =
          req.cookies.get("vibe_zonal_auth")?.value ||
          req.cookies.get("vibe_staff_station")?.value;
        if (adminCookie || staffCookie?.startsWith("station-")) {
          return NextResponse.next();
        }

        const authData = auth();
        if (!authData.userId) {
          return authData.redirectToSignIn({ returnBackUrl: req.url });
        }
        const userRole = (authData.sessionClaims?.metadata as any)?.role;
        if (userRole && userRole !== "admin") {
          const url = new URL("/app", req.url);
          return NextResponse.redirect(url);
        }
        return NextResponse.next();
      }

      // 3. Protect Staff Console (/staff/*)
      if (isStaffRoute(req)) {
        const staffCookie =
          req.cookies.get("vibe_zonal_auth")?.value ||
          req.cookies.get("vibe_staff_station")?.value;
        if (staffCookie) {
          return NextResponse.next();
        }
        const authData = auth();
        if (!authData.userId) {
          const url = new URL("/staff/login", req.url);
          return NextResponse.redirect(url);
        }
        return NextResponse.next();
      }

      // 4. Protect Attendee App (/app/*)
      if (isAppRoute(req)) {
        const devCookie = req.cookies.get("vibe_user_id")?.value;
        const authData = auth();
        if (!authData.userId && !devCookie) {
          return authData.redirectToSignIn({ returnBackUrl: req.url });
        }
        return NextResponse.next();
      }

      return NextResponse.next();
    });
  } catch (e) {
    console.warn("Clerk initialization deferred:", e);
  }
}

export default function middleware(req: NextRequest, ev: any) {
  if (clerkHandler) {
    return clerkHandler(req, ev);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
