import { NextResponse } from "next/server";
import { getSession, defaultSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ user: null, ...defaultSession });
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      displayName: session.displayName,
      pollarSubject: session.pollarSubject,
    },
  });
}
