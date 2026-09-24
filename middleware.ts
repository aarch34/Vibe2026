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
      "/api/webhooks(.*)",
      "/staff/login(.*)",
      "/admin/login(.*)",
      "/manifest.json",
      "/site.webmanifest",
      "/favicon.ico",
      "/favicon-96x96.png",
      "/apple-touch-icon.png",
      "/icon-(.*)",
      "/web-app-(.*)",
      "/images/(.*)",
    ]);

    const isAppRoute = createRouteMatcher(["/app(.*)"]);
    const isRegisterRoute = createRouteMatcher(["/register(.*)"]);
    const isStaffRoute = createRouteMatcher(["/staff(.*)"]);
    const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

    clerkHandler = clerkMiddleware((auth: any, req: any) => {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-pathname", req.nextUrl.pathname);

      const nextWithHeaders = () =>
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

      // 1. Allow public routes
      if (isPublicRoute(req)) {
        const res = nextWithHeaders();
        if (req.nextUrl.pathname.startsWith("/sign-in") && req.cookies.has("vibe_user_id")) {
          res.cookies.delete("vibe_user_id");
        }
        return res;
      }

      // 2. Enforce Clerk Authentication for Registration (/register)
      if (isRegisterRoute(req)) {
        const authData = auth();
        if (!authData.userId) {
          const url = new URL("/sign-up", req.url);
          url.searchParams.set("redirect_url", "/register");
          return NextResponse.redirect(url);
        }
        return nextWithHeaders();
      }

      // 3. Protect Admin Console (/admin/*)
      if (isAdminRoute(req)) {
        if (req.nextUrl.pathname.startsWith("/admin/login")) {
          return nextWithHeaders();
        }

        const adminCookie =
          req.cookies.get("vibe_admin_auth")?.value ||
          req.cookies.get("vibe_admin_token")?.value;
        const staffCookie =
          req.cookies.get("vibe_zonal_auth")?.value ||
          req.cookies.get("vibe_staff_station")?.value;

        if (adminCookie || staffCookie?.startsWith("station-")) {
          return nextWithHeaders();
        }

        const authData = auth();
        if (!authData.userId) {
          const url = new URL("/admin/login", req.url);
          url.searchParams.set("redirect_url", req.nextUrl.pathname);
          return NextResponse.redirect(url);
        }
        return nextWithHeaders();
      }

      // 4. Protect Staff Console (/staff/*)
      if (isStaffRoute(req)) {
        if (req.nextUrl.pathname.startsWith("/staff/login")) {
          return nextWithHeaders();
        }

        const staffCookie =
          req.cookies.get("vibe_zonal_auth")?.value ||
          req.cookies.get("vibe_staff_station")?.value;
        if (staffCookie) {
          return nextWithHeaders();
        }
        const authData = auth();
        if (!authData.userId) {
          const url = new URL("/staff/login", req.url);
          url.searchParams.set("redirect_url", req.nextUrl.pathname);
          return NextResponse.redirect(url);
        }
        return nextWithHeaders();
      }

      // 5. Protect Attendee App (/app/*)
      if (isAppRoute(req)) {
        const authData = auth();
        const attendeeCookie = req.cookies.get("vibe_user_id")?.value;

        if (!authData.userId && !attendeeCookie) {
          const res = authData.redirectToSignIn({ returnBackUrl: req.url });
          return res;
        }
        return nextWithHeaders();
      }

      return nextWithHeaders();
    });
  } catch (e) {
    console.warn("Clerk initialization deferred:", e);
  }
}

export default function middleware(req: NextRequest, ev: any) {
  if (clerkHandler) {
    return clerkHandler(req, ev);
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
