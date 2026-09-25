import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import { ChequeoClient } from "./ChequeoClient";

export const dynamic = "force-dynamic";

export default async function ChequeoPage() {
  const session = await requireSession(["USER"]);
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Pulso · chequeo</p>
          <h1 className="mt-2 text-[28px] font-semibold text-text">
            Chequeo de hoy
          </h1>
        </div>
        <LogoutButton />
      </div>
      <p className="mt-2 text-text-secondary">
            Puedes omitir este chequeo. Una pregunta a la vez.
      </p>
      <div className="mt-6">
        <ChequeoClient />
      </div>
      <Link
        href="/inicio"
        className="mt-8 block text-center text-sm text-primary underline"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
