import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertPulsoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      pollarSubject?: string;
      displayName?: string;
    };

    const email = body.email?.trim();
    const pollarSubject = body.pollarSubject?.trim();
    if (!email || !pollarSubject) {
      return NextResponse.json(
        { error: "email y pollarSubject son requeridos" },
        { status: 400 },
      );
    }

    const user = await upsertPulsoUser({
      email,
      pollarSubject,
      displayName: body.displayName?.trim() || email.split("@")[0],
    });

    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.pollarSubject = user.pollarSubject;
    session.displayName = user.profile?.displayName || user.email;
    await session.save();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/sync", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de sesión" },
      { status: 500 },
    );
  }
}
