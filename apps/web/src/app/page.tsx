import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await requireSession();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "FAMILY") redirect("/familiar");
  if (session?.role === "USER") redirect("/inicio");

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(165deg,#e8f4f5_0%,#f7fafc_45%,#eef2f7_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(13,92,99,0.18), transparent 42%), radial-gradient(circle at 82% 8%, rgba(13,92,99,0.12), transparent 36%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-primary">
            Pulso
          </p>
          <h1 className="max-w-xl text-[2.1rem] font-semibold leading-tight text-text sm:text-[2.6rem]">
            Tu red de apoyo en un toque
          </h1>
          <p className="max-w-lg text-lg text-text-secondary">
            Pulso avisa a tus familiares de confianza cuando necesitas ayuda.
            Un botón, un mensaje claro y un registro verificable de la alerta.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/entrar"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-6 text-lg font-semibold text-white"
            >
              Probar Pulso
            </Link>
            <p className="text-sm text-text-secondary sm:max-w-xs">
              Para la persona usuaria o su familiar. Entrada con correo y código
              OTP (Pollar).
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 py-12">
        <h2 className="text-xl font-semibold text-text">Para qué sirve</h2>
        <ul className="mt-5 space-y-4 text-text-secondary">
          <li>
            <span className="font-medium text-text">Alertar a tiempo.</span>{" "}
            Cuando la persona usuaria pide ayuda, Pulso notifica a su familiar
            con el contexto mínimo para actuar.
          </li>
          <li>
            <span className="font-medium text-text">Conocer a ambos lados.</span>{" "}
            Alta propia de Pulso para la persona usuaria y para el familiar:
            datos de contacto, domicilio y consentimientos claros.
          </li>
          <li>
            <span className="font-medium text-text">Modo prueba hoy.</span> Sin
            dispositivo físico todavía: puedes recorrer el flujo completo desde
            la web (alta → invitar familiar → alerta).
          </li>
        </ul>
      </section>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-8">
          <p className="text-xs text-text-secondary">
            Acceso interno del proyecto
          </p>
          <AdminLoginForm />
        </div>
      </footer>
    </main>
  );
}
