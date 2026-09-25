import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendContactRequestEmail } from "@/lib/email";
import {
  SCORE_VERSION,
  averageRecentScores,
  computePulsoDailyScore,
  formatLocalDay,
  localDayCDMX,
  parseAnswers,
  serializeAnswers,
  type CheckinAnswers,
  type ShareScope,
} from "@/lib/checkin";

export const dynamic = "force-dynamic";

function serializeCheckin(row: {
  id: string;
  localDay: Date;
  answersEncrypted: string;
  scoreVersion: string | null;
  score0100: number | null;
  completedAtUtc: Date | null;
  shareScope: string;
}) {
  return {
    id: row.id,
    localDay: formatLocalDay(row.localDay),
    answers: parseAnswers(row.answersEncrypted),
    scoreVersion: row.scoreVersion,
    score0100: row.score0100,
    completedAtUtc: row.completedAtUtc?.toISOString() ?? null,
    shareScope: row.shareScope as ShareScope,
  };
}

export async function GET() {
  const session = await requireSession(["USER"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const today = localDayCDMX();
  const [todayRow, history] = await Promise.all([
    prisma.dailyCheckin.findUnique({
      where: {
        userId_localDay: { userId: session.userId, localDay: today },
      },
    }),
    prisma.dailyCheckin.findMany({
      where: { userId: session.userId },
      orderBy: { localDay: "desc" },
      take: 14,
    }),
  ]);

  const completeScores = history
    .filter((h) => h.score0100 !== null)
    .map((h) => h.score0100 as number);
  const trend = averageRecentScores(completeScores);

  return NextResponse.json({
    today: todayRow ? serializeCheckin(todayRow) : null,
    localDay: formatLocalDay(today),
    history: history.map(serializeCheckin),
    trend,
  });
}

export async function POST(request: Request) {
  const session = await requireSession(["USER"]);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    answers?: CheckinAnswers;
    shareScope?: ShareScope;
    skipped?: boolean;
  };

  if (body.skipped) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!body.answers) {
    return NextResponse.json(
      { error: "answers es requerido" },
      { status: 400 },
    );
  }

  const answers = body.answers;
  const shareScope: ShareScope =
    body.shareScope === "family" ? "family" : "self";
  const score0100 = computePulsoDailyScore(answers);
  const today = localDayCDMX();
  const now = new Date();

  const checkin = await prisma.dailyCheckin.upsert({
    where: {
      userId_localDay: { userId: session.userId, localDay: today },
    },
    create: {
      userId: session.userId,
      localDay: today,
      answersEncrypted: serializeAnswers(answers),
      scoreVersion: SCORE_VERSION,
      score0100,
      completedAtUtc: now,
      shareScope,
    },
    update: {
      answersEncrypted: serializeAnswers(answers),
      scoreVersion: SCORE_VERSION,
      score0100,
      completedAtUtc: now,
      shareScope,
    },
  });

  let contactRequestId: string | null = null;
  if (answers.wantContact === true) {
    const existingOpen = await prisma.contactRequest.findFirst({
      where: {
        userId: session.userId,
        checkinId: checkin.id,
        status: "open",
      },
    });
    const req =
      existingOpen ||
      (await prisma.contactRequest.create({
        data: {
          userId: session.userId,
          checkinId: checkin.id,
          status: "open",
        },
      }));
    contactRequestId = req.id;

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });
    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.userId,
        kycStatus: "completed",
        verifiedAt: { not: null },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    const personName = profile?.displayName || session.displayName || "Alguien";
    for (const c of contacts) {
      await sendContactRequestEmail({
        to: c.email,
        contactName: c.name,
        personName,
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "checkin.save",
      objectType: "daily_checkin",
      objectId: checkin.id,
    },
  });

  const history = await prisma.dailyCheckin.findMany({
    where: { userId: session.userId },
    orderBy: { localDay: "desc" },
    take: 14,
  });
  const completeScores = history
    .filter((h) => h.score0100 !== null)
    .map((h) => h.score0100 as number);
  const trend = averageRecentScores(completeScores);

  return NextResponse.json({
    ok: true,
    checkin: serializeCheckin(checkin),
    contactRequestId,
    trend,
  });
}
