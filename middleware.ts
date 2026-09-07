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
    const isProtectedRoute = createRouteMatcher([
      "/app(.*)",
      "/admin(.*)",
      "/staff(.*)",
    ]);

    clerkHandler = clerkMiddleware((auth: any, req: any) => {
      if (isProtectedRoute(req)) {
        auth().protect();
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
