import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  formatLocalDay,
  parseAnswers,
} from "@/lib/checkin";

export const dynamic = "force-dynamic";

/**
 * Chequeos compartidos (share_scope=family) visibles para el familiar.
 */
export async function GET() {
  const session = await requireSession(["FAMILY", "ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      email: session.email.toLowerCase(),
      kycStatus: "completed",
      verifiedAt: { not: null },
    },
    select: { userId: true },
  });
  const userIds = [...new Set(contacts.map((c) => c.userId))];

  if (userIds.length === 0 && session.role !== "ADMIN") {
    return NextResponse.json({ checkins: [], contactRequests: [] });
  }

  const whereUser =
    session.role === "ADMIN" && userIds.length === 0
      ? {}
      : { userId: { in: userIds } };

  const [checkins, contactRequests] = await Promise.all([
    prisma.dailyCheckin.findMany({
      where: {
        ...whereUser,
        shareScope: "family",
      },
      orderBy: { localDay: "desc" },
      take: 20,
      include: {
        user: { include: { profile: true } },
      },
    }),
    prisma.contactRequest.findMany({
      where: {
        ...whereUser,
        status: "open",
      },
      orderBy: { createdAtUtc: "desc" },
      take: 20,
      include: {
        user: { include: { profile: true } },
      },
    }),
  ]);

  return NextResponse.json({
    checkins: checkins.map((c) => ({
      id: c.id,
      localDay: formatLocalDay(c.localDay),
      score0100: c.score0100,
      scoreVersion: c.scoreVersion,
      personName: c.user.profile?.displayName || c.user.email,
      // Familiar no ve respuestas detalladas de bienestar, solo índice si existe
      hasAnswers: Boolean(parseAnswers(c.answersEncrypted)),
    })),
    contactRequests: contactRequests.map((r) => ({
      id: r.id,
      createdAtUtc: r.createdAtUtc.toISOString(),
      personName: r.user.profile?.displayName || r.user.email,
      status: r.status,
    })),
  });
}
