import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession(["ADMIN"]);
  if (!session) redirect("/");

  const [users, incidents, devices] = await Promise.all([
    prisma.user.count(),
    prisma.incident.count(),
    prisma.device.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { profile: true },
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Pulso · administración</p>
          <h1 className="mt-2 text-[28px] font-semibold text-text">Panel del proyecto</h1>
        </div>
        <LogoutButton />
      </div>
      <p className="mt-2 text-text-secondary">
        Vista mínima. Cuestionarios KYC, consentimiento y auditoría clínica
        llegan en tickets posteriores.
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-text-secondary">Usuarios</dt>
          <dd className="text-2xl font-semibold text-text">{users}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-text-secondary">Incidentes</dt>
          <dd className="text-2xl font-semibold text-text">{incidents}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-text-secondary">Dispositivos</dt>
          <dd className="text-2xl font-semibold text-text">{devices}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-semibold text-text">Usuarios recientes</h2>
      <ul className="mt-3 space-y-2">
        {recentUsers.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-text"
          >
            <span className="font-medium">
              {u.profile?.displayName || u.email}
            </span>
            <span className="text-text-secondary"> · {u.role} · {u.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
