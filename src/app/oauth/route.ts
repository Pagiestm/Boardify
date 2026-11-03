import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE, isSecureUrl } from "@/features/auth/constants";

import { getAuth } from "@/lib/auth";
import { NEXT_COOKIE, safeNext } from "@/lib/safe-next";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");

  if (!userId || !secret) {
    return NextResponse.redirect(`${request.nextUrl.origin}/sign-up`);
  }

  try {
    const session = await getAuth().exchangeToken(userId, secret);

    const cookieStore = await cookies();
    const next = safeNext(cookieStore.get(NEXT_COOKIE)?.value);
    cookieStore.delete(NEXT_COOKIE);

    cookieStore.set(AUTH_COOKIE, session, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: isSecureUrl(request.nextUrl),
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(`${request.nextUrl.origin}${next ?? "/dashboard"}`);
  } catch {
    return NextResponse.redirect(`${request.nextUrl.origin}/sign-up`);
  }
}
