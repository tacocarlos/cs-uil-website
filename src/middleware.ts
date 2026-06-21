import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Injects the current request pathname into a request header so that server
 * components and layouts can read it via `headers().get("x-pathname")`.
 *
 * This is necessary because Next.js App Router server components have no
 * built-in API to read the current URL; it must be forwarded through headers.
 */
export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

export const config = {
    // Run on all routes except Next.js internals and static assets.
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
