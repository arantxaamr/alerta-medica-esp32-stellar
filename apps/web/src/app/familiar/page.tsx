import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { FamiliarCheckins } from "./FamiliarCheckins";

export const dynamic = "force-dynamic";

export default async function FamiliarHomePage() {
  const session = await requireSession(["FAMILY", "ADMIN"]);
  if (!session) redirect("/entrar");

  const incidents = await prisma.incident.findMany({
    where: {
      OR: [
        { notifications: { some: { contact: { email: session.email } } } },
        // demo: familiares ven alertas de Ana
        { user: { email: "ana.demo@pulso.local" } },
      ],
    },
    orderBy: { openedAtUtc: "desc" },
    take: 20,
    include: {
      user: { include: { profile: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Pulso · familiar</p>
          <h1 className="mt-2 text-[28px] font-semibold text-text">
            Alertas
          </h1>
        </div>
        <LogoutButton />
      </div>
      <p className="mt-2 text-text-secondary">
        Alertas de tu red. Sigue el{" "}
        <Link href="/protocolo" className="text-primary underline">
          protocolo familiar
        </Link>{" "}
        (confirmación ≤ 15 min, 911 humano).
      </p>
      <ul className="mt-6 space-y-3">
        {incidents.length === 0 ? (
          <li className="text-text-secondary">No hay alertas todavía.</li>
        ) : (
          incidents.map((i) => (
            <li key={i.id}>
              <Link
                href={`/familiar/alerta/${i.id}`}
                className="block rounded-xl border border-border bg-surface p-4"
              >
                <p className="font-medium text-text">
                  {i.user.profile?.displayName || i.user.email}
                </p>
                <p className="text-sm text-text-secondary">
                  {i.status} ·{" "}
                  {i.openedAtUtc.toLocaleString("es-MX", {
                    timeZone: "America/Mexico_City",
                  })}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
      <FamiliarCheckins />
    </main>
  );
}
