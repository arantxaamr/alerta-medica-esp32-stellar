import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { AltaUserForm } from "./AltaUserForm";

export const dynamic = "force-dynamic";

export default async function AltaPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (profile?.kycStatus === "completed") {
    redirect("/contactos?alta=1");
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Pulso · alta</p>
          <h1 className="mt-2 text-[28px] font-semibold text-text">
            Datos de la persona usuaria
          </h1>
        </div>
        <LogoutButton />
      </div>
      <p className="mt-2 text-text-secondary">
        Paso 1 de 2: conocerte (KYC propio de Pulso). Después podrás invitar a
        tu familiar de confianza.
      </p>
      <div className="mt-6">
        <AltaUserForm />
      </div>
    </main>
  );
}
