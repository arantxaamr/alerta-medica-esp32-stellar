import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sha256 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await prisma.appSession.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
  const response = NextResponse.json({ next: "/" });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
