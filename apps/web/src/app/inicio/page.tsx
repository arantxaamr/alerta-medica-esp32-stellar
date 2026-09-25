import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { localDayCDMX } from "@/lib/checkin";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (profile?.kycStatus !== "completed") {
    redirect("/alta");
  }

  const verifiedFamily = await prisma.contact.count({
    where: {
      userId: session.userId,
      kycStatus: "completed",
      verifiedAt: { not: null },
    },
  });

  const openIncident = await prisma.incident.findFirst({
    where: {
      userId: session.userId,
      status: { in: ["created", "family_acknowledged", "contacting"] },
    },
    orderBy: { openedAtUtc: "desc" },
  });

  const todayCheckin = await prisma.dailyCheckin.findUnique({
    where: {
      userId_localDay: {
        userId: session.userId,
        localDay: localDayCDMX(),
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-primary">Pulso · modo prueba</p>
          <LogoutButton />
        </div>
        <h1 className="text-[28px] font-semibold leading-tight text-text">
          Hola, {profile?.displayName || session.displayName}
        </h1>
        <p className="text-text-secondary">
          {openIncident
            ? "Tienes una alerta activa."
            : verifiedFamily > 0
              ? "Tu red de apoyo está lista."
              : "Alta lista. Invita a un familiar para recibir alertas."}
        </p>
        {todayCheckin ? (
          <p className="text-sm text-text-secondary">
            Chequeo de hoy:{" "}
            {todayCheckin.score0100 === null
              ? "guardado sin puntaje completo"
              : `bienestar reportado ${todayCheckin.score0100}/100`}
            .
          </p>
        ) : null}
      </header>

      {verifiedFamily === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-text-secondary">
          Aún no tienes un familiar con KYC completado.{" "}
          <Link href="/contactos" className="text-primary underline">
            Invitar ahora
          </Link>
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <Link
          href="/ayuda"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-danger px-4 text-center text-lg font-semibold text-white"
        >
          Necesito ayuda
        </Link>
        <Link
          href="/chequeo"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-4 text-center font-medium text-white"
        >
          Hacer mi chequeo de hoy
        </Link>
        <Link
          href="/contactos"
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-center font-medium text-text"
        >
          Ver mis contactos de ayuda
        </Link>
      </section>
    </main>
  );
}
